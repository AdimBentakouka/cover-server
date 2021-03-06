import * as bcrypt from "bcrypt";
import { Request, Response } from "express";
import { Sequelize } from "sequelize";

import { IGetUserAuthInfoRequest } from "../types/express/";

import { User } from "../models";

import * as Mail from "../utils/mail";
import * as Token from "../utils/token";

import Logger from "../utils/logger";

const logger = new Logger("user");

// import { User } from "../models/";

/**
 * * Tester si l'adresse mail est valide
 *
 * @param {string} email
 * @return {*}
 */
function validateEmail(email: string) {
	const emailReg = /^[\w\-]+(\.[\w\-]+)*@[\w\-]+(\.[\w\-]+)*\.[\w\-]{2,4}$/;
	return email.match(emailReg);
}

/**
 * Permet de créer un compte
 * générer un email pour faire valider son compte à l'administrateur
 * @param req Request
 * @param res Response
 */
export const createUser = (req: Request, res: Response): void => {
	const email: string = req.body.email;
	const username: string = req.body.username;
	const password: string = req.body.password;

	const err: string[] = [];
	//check si le formulaire est bien renseigné
	if (!email || !validateEmail(email)) {
		err.push("L'adresse mail n'est pas valide");
	}
	if (!username) {
		err.push("Le nom d'utilisateur n'est pas renseignée");
	}
	if (!password) {
		err.push("Le mot de passe n'est pas renseignée");
	}

	if (err.length > 0) {
		res.status(400).send("Veuiller renseigner tous les champs !");
	} else {
		//Check si l'adresse mail est déjà utilisé
		User.findOne({ where: { email: email } }).then((user) => {
			if (user) {
				logger.warn(`L'adresse mail ${email} a déjà été utilisée !`);
				res.status(400).send("Adresse mail déjà utilisée !");
			} else {
				User.create({
					name: username,
					email: email,
					password: bcrypt.hashSync(password, parseInt(process.env.SALT_BCRYPT)),
				}).then((user) => {
					logger.info(`L'utilisateur ${user.name} à été créée !`);

					Mail.sendMailValidAccount(user.name, user.id);

					res.send(`${user.name} à été créée !`);
				});
			}
		});
	}
};

/**
 * Permet de se connecter et génère un token et un refreshToken
 * @param req
 * @param res
 */

export const login = (req: Request, res: Response): void => {
	const email: string = req.body.email;
	const password: string = req.body.password;

	if (!email || !password) {
		res.status(400).send("Veuillez renseigner les champs email et password");
	} else {
		//Check s'il le compte existe
		User.findOne({ where: Sequelize.where(Sequelize.fn("upper", Sequelize.col("email")), email.toUpperCase()) })
			.then(async (user) => {
				if (user) {
					const passwordValid = bcrypt.compareSync(password, user.password);

					if (passwordValid) {
						if (user.accountValid) {
							const token = Token.generateToken({
								id: user.id,
								email: user.email,
								name: user.name,
								isAdmin: user.isAdmin,
							});

							Token.generateRefreshToken(user.id, req)
								.then((refreshToken) => {
									res.send({
										token: token,
										refreshToken: refreshToken,
									});
								})
								.catch((err) => {
									logger.error(err);
									res.send({
										token: token,
										refreshToken: null,
									});
								});
						} else {
							res.status(400).send("Le compte n'a pas été validé par l'administrateur !");
						}
					} else {
						res.status(400).send("Mot de passe incorrect !");
					}
				} else {
					logger.warn(`Le compte ${email} est introuvable !`);
					res.status(400).send("Adresse e-mail introuvable !");
				}
			})
			.catch((err) => {
				logger.error(err);
				res.status(400).send(err);
			});
	}
};

export const refreshToken = (req: Request, res: Response): void => {
	// récupère le refreshToken
	const refreshToken = req.headers.refreshtoken as string;

	if (refreshToken) {
		Token.generateNewToken(refreshToken)
			.then((token) => {
				res.send({ token: token });
			})
			.catch((err) => {
				logger.error(JSON.stringify(err));
				res.status(401).send(err);
			});
	} else {
		res.status(401).send("refreshtoken not found");
	}
};

export const validaccount = (req: IGetUserAuthInfoRequest, res: Response): void => {
	if (!req.user) {
		res.status(401).send("Authentification requise !");
	}

	if (!req.user.isAdmin) {
		res.status(403).send("Vous n'avez pas les droits");
	}

	const userId = req.params.userid;

	if (!userId) {
		res.status(400).send("userId is null");
	}

	//check en bdd si l'userid existe
	User.findOne({ where: { id: userId } })
		.then((user) => {
			if (user) {
				if (user.accountValid) {
					res.status(400).send("User already validate !");
				} else {
					user.accountValid = new Date();
					user.save();

					// envoyer le mail à l'utilisateur pour l'informer que son compte est validé !
					Mail.sendMailValid(user.name, user.email);

					res.send("account validate !");
				}
			} else {
				res.status(400).send("User not found !");
			}
		})
		.catch((err) => {
			res.send(err);
		});
};

export const getAllAccount = (req: IGetUserAuthInfoRequest, res: Response): void => {
	if (!req.user) {
		res.status(401).send("Authentification requise !");
	} else if (!req.user.isAdmin) {
		res.status(403).send("Vous n'avez pas les droits");
	} else {
		User.findAll({
			attributes: ["id", "name", "email", "isAdmin", "accountValid", "createdAt"],
		})
			.then((data) => {
				res.json(data);
			})
			.catch((err) => {
				console.log(err);
				res.status(400).send(err);
			});
	}
};

export const deleteAccount = (req: IGetUserAuthInfoRequest, res: Response): void => {
	if (!req.user) {
		res.status(401).send("Authentification requise !");
	} else if (!req.user.isAdmin) {
		res.status(403).send("Vous n'avez pas les droits");
	} else {
		if (req.params.id) {
			User.findOne({
				attributes: ["id", "name", "email", "isAdmin", "accountValid", "createdAt"],
				where: { id: req.params.id },
			})
				.then(async (user) => {
					if (user.isAdmin) {
						res.status(400).send("Vous n'avez pas les droits pour supprimer ce compte");
					} else {
						await user.destroy();
						res.send("Compte supprimé");
					}
				})
				.catch((err) => {
					res.status(400).send(err);
				});
		}
	}
};

import nodemailer from "nodemailer";
import EmailTemplate from "email-templates";
import Logger from "./logger";

const logger = new Logger("mail");

const CLIENT_URL_VALID_ACCOUNT = process.env.CLIENT_URL_VALID_ACCOUNT || "http://localhost:3001/user/admin/validaccount/";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3001/auth/login";

const smtpTransport = nodemailer.createTransport({
	service: process.env.SMTP_SERVICE,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD,
	},
});

const email = new EmailTemplate({
	message: {
		from: process.env.SMTP_USER,
	},
	transport: smtpTransport,
	views: {
		options: {
			extension: "twig",
		},
	},
});

export function sendMailValidAccount(name: string, userid: string): void {
	email
		.render(`${__dirname}/../views/mail/valideAccount.html.twig`, { name: name, url: `${CLIENT_URL_VALID_ACCOUNT}${userid}` })
		.then((result) => {
			smtpTransport.sendMail(
				{
					from: process.env.SMTP_USER,
					to: process.env.SMTP_USER,
					subject: "[CoverJS] - Nouvel utilisateur",
					html: result,
				},
				(err, info) => {
					if (err) logger.error(err.toString());
					else logger.info(info.response);
				}
			);
		})
		.catch((err) => logger.error(err));
}

export function sendMailValid(name: string, mail: string): void {
	email
		.render(`${__dirname}/../views/mail/comptevalide.html.twig`, { name: name, url: CLIENT_URL })
		.then((result) => {
			smtpTransport.sendMail(
				{
					from: process.env.SMTP_USER,
					to: mail,
					subject: "[CoverJS] - ton compte a été validé",
					html: result,
				},
				(err, info) => {
					if (err) logger.error(err.toString());
					else logger.info(info.response);
				}
			);
		})
		.catch((err) => logger.error(err));
}

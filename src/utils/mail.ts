import nodemailer from "nodemailer";
import EmailTemplate from "email-templates";
import Logger from "../helpers/logger";

const logger = new Logger("mail");

const smtpTransport = nodemailer.createTransport({
     service: process.env.SMTP_SERVICE,
     secure: true,
     auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
     }
});

const email = new EmailTemplate({
     message: {
          from: process.env.SMTP_USER
     },
     transport: smtpTransport,
     views: {
          options: {
               extension: "twig"
          }
     }
});

export function sendMailValidAccount(name: string, userid: string): void {

    email.render("../src/views/mail/valideAccount.html.twig", {name: name, url: "http://localhost:8080/user/admin/validaccount/"+userid})
    .then((result) => {
          smtpTransport.sendMail({
               from: process.env.SMTP_USER,
               to: process.env.SMTP_USER,
               subject: "[CoverJS] - Nouvel utilisateur",
               html: result
          }, (err, info) => {
               if (err) logger.error(err.toString());
               else logger.info(info.response);
          }); 
    });

}

export function sendMailValid(name: string, mail: string): void {

     email.render("../src/views/mail/comptevalide.html.twig", {name: name, url: "http://localhost:3000/login"})
     .then((result) => {
           smtpTransport.sendMail({
                from: process.env.SMTP_USER,
                to: mail,
                subject: "[CoverJS] - ton compte a été validé",
                html: result
           }, (err, info) => {
                if (err) logger.error(err.toString());
                else logger.info(info.response);
           }); 
     });
 
 }
 

import Secrets from "@/infrastructure/secrets";
import nodemailer from "nodemailer";

export default class MailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    const secrets = new Secrets();
    this.from = secrets.mailerCredentials.MAILER_USER;

    this.transporter = nodemailer.createTransport({
      service: secrets.mailerCredentials.MAILER_SERVICE,
      auth: {
        user: secrets.mailerCredentials.MAILER_USER,
        pass: secrets.mailerCredentials.MAILER_PASSWORD,
      },
    });
  }

  async sendEmail(
    recipient: string,
    subject: string,
    message: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: recipient,
      subject,
      html: message,
      text: message.replace(/<[^>]*>/g, ""),
    });
  }
}

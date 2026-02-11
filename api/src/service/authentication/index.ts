import type { AddUserParams } from "@/domain/user/entity";
import type UserRepository from "@/domain/user/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import {
  compareHash,
  generateJWTToken,
  verifyToken,
} from "@/infrastructure/utils/encryption";
import MailService from "../mail";
import EmailTemplatesService from "../mail/template";

export default class AuthenticationService {
  userRepository: UserRepository;
  mailService: MailService;
  emailTemplatesService: EmailTemplatesService;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;

    this.mailService = new MailService();
    this.emailTemplatesService = new EmailTemplatesService();
  }

  authenticate = async (email: string, password: string) => {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestError("invalid credentials");
    }

    const isPasswordValid = await compareHash(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestError("invalid credentials");
    }

    if (user) {
      delete user.password;
    }

    return user;
  };

  register = async (params: AddUserParams) => {
    const user = await this.userRepository.add(params);

    const { subject, message } = this.emailTemplatesService.getSignUpEmail(
      user.name,
    );
    await this.mailService.sendEmail(user.email, subject, message);

    return user;
  };

  forgotPassword = async (email: string) => {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestError("user not found");
    }

    const payload: Payload = { id: user.id as string };
    const token = generateJWTToken(payload);

    const { subject, message } =
      this.emailTemplatesService.getForgotPasswordEmail(user.name, token);

    await this.mailService.sendEmail(email, subject, message);

    return { message: "A reset link has been sent to your email" };
  };

  resetPassword = async (token: string, password: string) => {
    const payload = verifyToken(token) as Payload;

    const user_id = payload.id as string;

    const user = await this.userRepository.findById(user_id);

    if (!user) {
      throw new BadRequestError("invalid or expired reset token");
    }

    const updatedUser = this.userRepository.update({
      id: user_id,
      password,
    });

    return updatedUser;
  };

  sendVerificationEmail = async (email: string) => {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestError("user not found");
    }

    const payload: Payload = { id: user.id as string };
    const token = generateJWTToken(payload);

    const { subject, message } =
      this.emailTemplatesService.getVerificationEmail(user.name, token);

    await this.mailService.sendEmail(email, subject, message);
  };

  verify = async (token: string) => {
    const payload = verifyToken(token) as Payload;
    const user_id = payload.id as string;

    const user = await this.userRepository.findById(user_id);

    if (!user) {
      throw new BadRequestError("invalid or expired verification token");
    }

    const updatedUser = await this.userRepository.update({
      id: user_id,
      is_verified: true,
    });

    return updatedUser;
  };
}

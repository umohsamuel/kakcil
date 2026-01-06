import type { AddUserParams } from "@/domain/user/entity";
import type UserRepository from "@/domain/user/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import {
  compareHash,
  generateJWTToken,
} from "@/infrastructure/utils/encryption";
import MailService from "../mail";

export default class AuthenticationService {
  userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
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

    return user;
  };

  forgotPassword = async (email: string) => {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestError("user not found");
    }

    const payload: Payload = { id: user.id as string };
    const token = generateJWTToken(payload);

    const mailService = new MailService();

    await mailService.sendEmail(
      email,
      "Reset Password",
      `Please click the link below to reset your password: http://localhost:3000/reset-password?token=${token}`,
    );

    return { message: "email sent" };
  };

  resetPassword = async (userId: string, password: string) => {
    const user = this.userRepository.update({
      id: userId,
      password,
    });

    return user;
  };
}

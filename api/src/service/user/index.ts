import type { AddUserParams, UpdateUserParams } from "@/domain/user/entity";
import type UserRepository from "@/domain/user/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";

export default class UserService {
  userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(user: AddUserParams) {
    return this.userRepository.add(user);
  }

  async updateUser(userId: string, user: UpdateUserParams) {
    return this.userRepository.update({ id: userId, ...user });
  }

  async verifyUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError("User not found");
    }

    return await this.userRepository.update({
      id: userId,
      is_verified: true,
    });
  }

  async getAllUsers() {
    return this.userRepository.getAll();
  }

  async getUserById(userId: string) {
    return this.userRepository.findById(userId);
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async deleteUser(userId: string) {
    return this.userRepository.delete(userId);
  }
}

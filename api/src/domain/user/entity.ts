import { BadRequestError } from "@/infrastructure/errors/badRequest";

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  is_verified: boolean;
}

export default class User {
  public readonly id?: string;
  public name: string;
  public email: string;
  public password: string;
  public is_verified: boolean;

  constructor(props: User) {
    this.id = props.id;
    this.name = props.name;

    if (!props.email.includes("@")) throw new BadRequestError("Invalid email");
    this.email = props.email;

    if (props.password.length < 8)
      throw new BadRequestError("Password too short");
    this.password = props.password;
    this.is_verified = props.is_verified;
  }

  getPassword() {
    return this.password;
  }

  setPassword(newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    return new User({
      ...this,
      password: newPassword,
    });
  }

  changePassword(oldPassword: string, newPassword: string): User {
    if (this.password !== oldPassword) {
      throw new BadRequestError("Old password is incorrect");
    }

    if (newPassword.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    return new User({
      ...this,
      password: newPassword,
    });
  }

  verify() {
    return new User({
      ...this,
      is_verified: true,
    });
  }
}

export type AddUserParams = {
  name: string;
  email: string;
  password: string;
  is_verified?: boolean;
};

export type UpdateUserParams = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  is_verified?: boolean;
};

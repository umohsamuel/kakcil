import * as jwt from "jsonwebtoken";
import AppSecrets from "../secrets";
import { ForbiddenError } from "../errors/forbidden";
import * as bcrypt from "bcryptjs";

export const encrypt = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const DUMMY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8E9zQvQGZ7Rk8Y7Jv1Zk5v8b9v8b9e";

export const compareHash = async (
  password: string,
  hash?: string,
): Promise<boolean> => {
  const safeHash = hash ?? DUMMY_HASH;
  return await bcrypt.compare(password, safeHash);
};

export const generateJWTToken = (payload: string | object): string => {
  const environmentVariables = new AppSecrets();
  const options: jwt.SignOptions = {
    expiresIn: environmentVariables.jwtExpires,
  };
  return jwt.sign(payload, environmentVariables.jwtSecret, options);
};

export const generateRefreshJWTToken = (payload: string | object): string => {
  const environmentVariables = new AppSecrets();
  const options: jwt.SignOptions = {
    expiresIn: environmentVariables.refreshJWTExpires,
  };
  return jwt.sign(payload, environmentVariables.refreshJWTSecret, options);
};

export const verifyToken = (token: string) => {
  const environmentVariables = new AppSecrets();
  try {
    return jwt.verify(token, environmentVariables.jwtSecret);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ForbiddenError("invalid session");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ForbiddenError("invalid token");
    } else {
      throw error;
    }
  }
};

export const verifyRefreshToken = (token: string) => {
  const environmentVariables = new AppSecrets();
  try {
    return jwt.verify(token, environmentVariables.refreshJWTSecret);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ForbiddenError("invalid session");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ForbiddenError("invalid token");
    } else {
      throw error;
    }
  }
};

import CryptoJS from "crypto-js";

export const encryptApiKey = (apiKey: string): string => {
  const environmentVariables = new AppSecrets();

  const encryptionKey = environmentVariables.encryptionKey;
  return CryptoJS.AES.encrypt(apiKey, encryptionKey).toString();
};

export const decryptApiKey = (encryptedKey: string): string => {
  const environmentVariables = new AppSecrets();

  const encryptionKey = environmentVariables.encryptionKey;
  const bytes = CryptoJS.AES.decrypt(encryptedKey, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

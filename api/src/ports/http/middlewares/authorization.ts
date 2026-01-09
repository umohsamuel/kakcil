import { UnAuthorizedError } from "@/infrastructure/errors/unauthorized";
import { verifyToken } from "@/infrastructure/utils/encryption";
import type AuthenticationService from "@/service/authentication";
import type { NextFunction, Request, Response } from "express";

export const Authorize = (services: AuthenticationService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let { token } = req.signedCookies;
    if (!token) {
      token = req.headers.authorization?.split(" ")[1];
    }
    if (!token) {
      token = req.query.token;
    }
    if (!token) throw new UnAuthorizedError("session has expired");

    try {
      const jwtPayload = verifyToken(token);
      const payload: Payload = jwtPayload as Payload;

      const user = await services.userRepository.findById(payload.id);

      if (!user) throw new UnAuthorizedError("invalid token");

      req.user = user;
      next();
    } catch (error) {
      console.log("[ Authorize error ]: ", error);

      throw new UnAuthorizedError("invalid token");
    }
  };
};

export const AuthorizeRefreshToken = (services: AuthenticationService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let { refreshToken } = req.signedCookies;
    if (!refreshToken) {
      refreshToken = req.headers.authorization?.split(" ")[1];
    }
    if (!refreshToken) {
      refreshToken = req.query.refreshToken;
    }
    if (!refreshToken) throw new UnAuthorizedError("session has expired");

    try {
      const jwtPayload = verifyToken(refreshToken);
      const payload: Payload = jwtPayload as Payload;

      const user = await services.userRepository.findById(payload.id);

      if (!user) throw new UnAuthorizedError("invalid token");

      req.user = user;
      next();
    } catch (error) {
      console.log("[ AuthorizeRefreshToken error ]: ", error);

      throw new UnAuthorizedError("invalid token");
    }
  };
};

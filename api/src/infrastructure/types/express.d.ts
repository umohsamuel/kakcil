import type User from "@/domain/user/entity";

declare global {
  namespace Express {
    export interface Request {
      user: User;
      signedCookies?: any;
    }
  }
}

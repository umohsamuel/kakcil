import type { IUser } from "@/domain/user/entity";

declare global {
  namespace Express {
    export interface Request {
      user: IUser;
      signedCookies?: any;
    }
  }
}

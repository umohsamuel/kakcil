import { type Request, type Response, type NextFunction } from "express";
import type Adapter from "@/adapter";
import type { IUser } from "@/domain/user/entity";
import { ErrorResponse } from "@/infrastructure/responses/error";
import { StatusCodes } from "http-status-codes";

export interface AuthRequest extends Request {
  user_id?: string;
  adapter?: Adapter;
}

export const CheckMessageLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as IUser;
    const id = user.id;

    if (!id) {
      return new ErrorResponse(
        res,
        "Unauthorized",
        StatusCodes.UNAUTHORIZED,
      ).send();
    }

    const adapter = req.adapter;
    if (!adapter) {
      return new ErrorResponse(res, "Adapter not available").send();
    }

    const limitCheck = await adapter.subscriptionAdapter.checkMessageLimit(id);

    if (!limitCheck.allowed) {
      return new ErrorResponse(
        res,
        "Rate limit exceeded",
        StatusCodes.TOO_MANY_REQUESTS,
        {
          error: "Rate limit exceeded",
          message: limitCheck.reason,
          limits: limitCheck.limits,
          usage: limitCheck.usage,
          upgradeUrl: "/pricing",
        },
      ).send();
    }

    next();
  } catch (error) {
    console.error("Rate limit check error:", error);
    next(error);
  }
};

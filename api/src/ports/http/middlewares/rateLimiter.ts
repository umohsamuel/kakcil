import { type Request, type Response, type NextFunction } from "express";
import type Adapter from "@/adapter";
import type { IUser } from "@/domain/user/entity";
import { ErrorResponse } from "@/infrastructure/responses/error";
import { StatusCodes } from "http-status-codes";
import type Services from "@/service";

export const CheckMessageLimit = (adapter: Adapter, _services: Services) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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

      if (!adapter) {
        return new ErrorResponse(res, "Adapter not available").send();
      }

      const activeByokKeys = await adapter.userApiKeyAdapter.getActiveKeys(id);

      const limitCheck =
        await adapter.subscriptionAdapter.checkMessageLimit(id);

      console.log(
        "limit check and active byok keys",
        limitCheck,
        activeByokKeys,
      );

      if (!limitCheck.allowed && activeByokKeys && activeByokKeys.length < 1) {
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
};

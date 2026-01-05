import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type RequestData = "body" | "query" | "params" | "headers" | "url";

const ValidationMiddleware = (schema: ZodTypeAny, reqData: RequestData) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[reqData]);
      next();
    } catch (error) {
      console.log("Validation error: ", error, "Req data: ", reqData);
      res.status(400).json(error);
      throw error;
    }
  };
};

export default ValidationMiddleware;

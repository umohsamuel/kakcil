import { NotFoundError } from "@/infrastructure/errors/notFound";
import type { Request, Response } from "express";

const Route404 = (_req: Request, _res: Response) => {
  throw new NotFoundError("404 ROUTE!!!");
};

export default Route404;

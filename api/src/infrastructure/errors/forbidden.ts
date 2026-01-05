import { StatusCodes } from "http-status-codes";
import { ApiError } from ".";

export class ForbiddenError extends ApiError {
  constructor(message: string) {
    super(message);
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

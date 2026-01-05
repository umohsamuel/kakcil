import { StatusCodes } from "http-status-codes";
import { ApiError } from ".";

export class UnAuthorizedError extends ApiError {
  constructor(message: string) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

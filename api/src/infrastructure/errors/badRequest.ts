import { StatusCodes } from "http-status-codes";
import { ApiError } from ".";

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

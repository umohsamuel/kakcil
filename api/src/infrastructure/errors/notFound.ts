import { StatusCodes } from "http-status-codes";
import { ApiError } from ".";

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

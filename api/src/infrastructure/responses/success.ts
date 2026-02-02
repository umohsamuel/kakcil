import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppSecrets from "../secrets";

export class SuccessResponse {
  success: Success;
  response: Response;

  constructor(res: Response, data?: any, metadata?: any) {
    this.response = res;
    this.success = {
      statusCode: res.statusCode,
      message: "success",
    };

    if (data !== null && data !== undefined) {
      this.success.data = data;
    }

    if (metadata !== null && metadata !== undefined) {
      this.success.metadata = metadata;
    }
  }

  send = () => {
    this.response.status(this.success.statusCode).json(this.success);
  };
}

export class SuccessResponseWithHTML {
  html: string;
  response: Response;

  constructor(res: Response, html: string) {
    this.response = res;
    this.html = html;
  }

  send = () => {
    this.response.status(StatusCodes.OK).send(this.html);
  };
}

export class SuccessResponseWithCookies {
  success: Success;
  response: Response;
  cookie: Cookie[];

  constructor(res: Response, cookie: Cookie[], data?: any, metadata?: any) {
    this.response = res;
    this.cookie = cookie;
    this.success = {
      statusCode: res.statusCode,
      message: "success",
    };
    if (data !== null && data !== undefined) {
      this.success.data = data;
    }

    if (metadata !== null && metadata !== undefined) {
      this.success.metadata = metadata;
    }
  }

  send = () => {
    const environmentVariables = new AppSecrets();
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      signed: true,
      maxAge: environmentVariables.cookieExpires,
      httpOnly: false,
      secure: isProduction, // Required for sameSite: 'none'
      sameSite: isProduction ? ("none" as const) : ("lax" as const), // Required for cross-origin cookies
    };

    if (this.cookie[0]) {
      this.response.cookie(this.cookie[0].key, this.cookie[0].value, cookieOptions);
    }
    if (this.cookie[1]) {
      this.response.cookie(this.cookie[1].key, this.cookie[1].value, cookieOptions);
    }
    this.response.status(this.success.statusCode).json(this.success);
  };

  logout = () => {
    const isProduction = process.env.NODE_ENV === "production";
    const clearCookieOptions = {
      signed: true,
      maxAge: 0,
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
    };

    this.response
      .cookie("token", "", clearCookieOptions)
      .cookie("refreshToken", "", clearCookieOptions)
      .json(this.success);
  };
}

export class FileDownloadResponse {
  constructor(
    private res: Response,
    private fileBuffer: Buffer,
    private fileName: string,
    private mimeType: string = "application/octet-stream"
  ) {}

  send = () => {
    this.res.set({
      "Content-Type": this.mimeType,
      "Content-Disposition": `attachment; filename="${this.fileName}"`,
      "Content-Length": this.fileBuffer.length,
    });
    this.res.status(200).send(this.fileBuffer);
  };
}

type Success = {
  statusCode: number;
  message: string;
  data?: any;
  metadata?: any;
};

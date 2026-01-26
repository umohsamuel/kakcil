import { config } from "dotenv";

export type PostgresCredentials = {
  user: string;
  password: string;
  db: string;
  host: string;
  port: number;
  ssl: boolean;
};

// export type CloundinaryCredentials = {
//   cloudName: string;
//   apiKey: string;
//   apiSecret: string;
// };

export type DBConnectionCredentials = {
  PGHOST: string;
  PGDATABASE: string;
  PGUSER: string;
  PGPASSWORD: string;
  PGSSLMODE: string;
  PGCHANNELBINDING: string;
  PGPORT: number;
};

export type MailerCredentials = {
  MAILER_USER: string;
  MAILER_PASSWORD: string;
  MAILER_SERVICE: string;
};

// export type AISDKProvider = "google" | "openai" | "anthropic";

config();

export default class Secrets {
  port: number;
  clientOrigin: string;
  cookieExpires: number;
  cookieSecret: string;
  jwtExpires: number;
  jwtSecret: string;
  refreshJWTExpires: number;
  refreshJWTSecret: string;

  // cloudinaryCredentials: CloundinaryCredentials;
  dbConnectionCredentials: DBConnectionCredentials;
  mailerCredentials: MailerCredentials;

  constructor() {
    this.port = parseInt(process.env.SERVER_PORT || "8080");
    this.clientOrigin = this.getEnvironmentVariableOrFallback(
      "CLIENT_ORIGIN",
      "localhost:3000",
    );
    this.cookieExpires = this.getEnvironmentVariableAsNumber(
      "COOKIE_EXPIRES",
      604_800,
    );
    this.cookieSecret = this.getEnvironmentVariable("COOKIE_SECRET");
    this.jwtExpires = this.getEnvironmentVariableAsNumber(
      "JWT_EXPIRES",
      604_800,
    );
    this.jwtSecret = this.getEnvironmentVariable("JWT_SECRET");
    this.refreshJWTExpires = this.getEnvironmentVariableAsNumber(
      "REFRESH_JWT_EXPIRES",
      2592000,
    );
    this.refreshJWTSecret = this.getEnvironmentVariable("REFRESH_JWT_SECRET");

    // this.cloudinaryCredentials = {
    //   cloudName: this.getEnvironmentVariable("CLOUDINARY_CLOUD_NAME"),
    //   apiKey: this.getEnvironmentVariable("CLOUDINARY_API_KEY"),
    //   apiSecret: this.getEnvironmentVariable("CLOUDINARY_API_SECRET"),
    // };

    this.mailerCredentials = {
      MAILER_USER: this.getEnvironmentVariable("MAILER_USER"),
      MAILER_PASSWORD: this.getEnvironmentVariable("MAILER_PASSWORD"),
      MAILER_SERVICE: this.getEnvironmentVariable("MAILER_SERVICE"),
    };

    this.dbConnectionCredentials = {
      PGHOST: this.getEnvironmentVariable("PGHOST"),
      PGDATABASE: this.getEnvironmentVariable("PGDATABASE"),
      PGUSER: this.getEnvironmentVariable("PGUSER"),
      PGPASSWORD: this.getEnvironmentVariable("PGPASSWORD"),
      PGSSLMODE: this.getEnvironmentVariable("PGSSLMODE"),
      PGCHANNELBINDING: this.getEnvironmentVariable("PGCHANNELBINDING"),
      PGPORT: this.getEnvironmentVariableAsNumber("PGPORT", 5432),
    };
  }

  getEnvironmentVariable(key: string): string {
    let value = process.env[key];
    if (!value) {
      console.error(`Error: Environment variable "${key}" is not available.`);
      process.exit(1);
    }
    return value;
  }

  getEnvironmentVariableOrFallback(key: string, fallback: string): string {
    let value = process.env[key];
    if (!value) {
      return fallback;
    }
    return value;
  }

  getEnvironmentVariableAsNumber(key: string, fallback: number): number {
    let value = process.env[key];
    if (!value) {
      return fallback;
    }

    const valueNumber = Number(value);
    if (isNaN(valueNumber) || !isFinite(valueNumber)) {
      console.error(
        `Error: Environment variable "${key}" value "${value}" is not a valid number.`,
      );
      process.exit(1);
    }

    return valueNumber;
  }

  getEnvironmentVariableAsBool(key: string, fallback: boolean): boolean {
    let value = process.env[key];
    if (!value) {
      return fallback;
    }

    const valueLower = value.toLowerCase();
    if (valueLower !== "true" && valueLower !== "false") {
      console.error(
        `Error: Environment variable "${key}" value "${value}" is not a valid boolean. Use "true" or "false".`,
      );
      process.exit(1);
    }

    return valueLower === "true";
  }
}

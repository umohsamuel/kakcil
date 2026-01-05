import { Pool } from "pg";
import { type DBConnectionCredentials } from "../secrets";

export const pgPoolConnection = (credentials: DBConnectionCredentials) => {
  return new Pool({
    host: credentials.PGHOST,
    database: credentials.PGDATABASE,
    user: credentials.PGUSER,
    password: credentials.PGPASSWORD,
    port: credentials.PGPORT,
    ssl: {
      //@ts-expect-error
      require: true,
    },
  });
};

import type Secrets from "@/infrastructure/secrets";
import { type Pool } from "pg";
import UserAdapter from "./user";

export default class Adapter {
  pgPool: Pool;
  secrets: Secrets;

  userAdapter: UserAdapter;

  constructor(pgPool: Pool, secrets: Secrets) {
    this.pgPool = pgPool;
    this.secrets = secrets;

    this.userAdapter = new UserAdapter(this.pgPool);
  }
}

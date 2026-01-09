import type Secrets from "@/infrastructure/secrets";
import { type Pool } from "pg";
import UserAdapter from "./user";
import LLMAdapter from "./llm";

export default class Adapter {
  pgPool: Pool;
  secrets: Secrets;

  userAdapter: UserAdapter;
  llmAdapter: LLMAdapter;

  constructor(pgPool: Pool, secrets: Secrets) {
    this.pgPool = pgPool;
    this.secrets = secrets;

    this.userAdapter = new UserAdapter(this.pgPool);
    this.llmAdapter = new LLMAdapter(this.pgPool, this.secrets);
  }
}

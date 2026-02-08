import type Secrets from "@/infrastructure/secrets";
import { type Pool } from "pg";
import UserAdapter from "./user";
import LLMAdapter from "./llm";
import ChatAdapter from "./chat";
import ModelAdapter from "@/adapter/model";
import CouncilAdapter from "@/adapter/council";
import ChatBranchAdapter from "@/adapter/chat/branch";
import CouncilResponseAdapter from "@/adapter/council/response";
import SubscriptionAdapter from "./subscription/index";
import UserApiKeyAdapter from "./user/api_key";

export default class Adapter {
  pgPool: Pool;
  secrets: Secrets;

  userAdapter: UserAdapter;
  llmAdapter: LLMAdapter;
  chatAdapter: ChatAdapter;
  modelAdapter: ModelAdapter;
  councilAdapter: CouncilAdapter;
  chatBranchAdapter: ChatBranchAdapter;
  councilResponseAdapter: CouncilResponseAdapter;
  subscriptionAdapter: SubscriptionAdapter;
  userApiKeyAdapter: UserApiKeyAdapter;

  constructor(pgPool: Pool, secrets: Secrets) {
    this.pgPool = pgPool;
    this.secrets = secrets;

    this.userAdapter = new UserAdapter(this.pgPool);
    this.chatAdapter = new ChatAdapter(this.pgPool);
    this.modelAdapter = new ModelAdapter();
    this.councilAdapter = new CouncilAdapter(this.pgPool);
    this.chatBranchAdapter = new ChatBranchAdapter(this.pgPool);
    this.councilResponseAdapter = new CouncilResponseAdapter(this.pgPool);
    this.subscriptionAdapter = new SubscriptionAdapter(this.pgPool);
    this.userApiKeyAdapter = new UserApiKeyAdapter(this.pgPool);

    this.llmAdapter = new LLMAdapter(
      this.pgPool,
      this.secrets,
      this.modelAdapter,
      this.councilAdapter,
      this.userApiKeyAdapter,
    );
  }
}

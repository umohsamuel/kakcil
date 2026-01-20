import type Adapter from "@/adapter";
import UserService from "./user";
import AuthenticationService from "./authentication";
import ChatService from "./chat";
import LLMService from "@/service/llm";

export default class Services {
  userService: UserService;
  authenticationService: AuthenticationService;
  llmService: LLMService;
  chatService: ChatService;
  adapter: Adapter;

  constructor(adapter: Adapter) {
    this.userService = new UserService(adapter.userAdapter);
    this.authenticationService = new AuthenticationService(adapter.userAdapter);
    this.llmService = new LLMService(adapter.llmAdapter);
    this.chatService = new ChatService(
      adapter.llmAdapter,
      adapter.chatAdapter,
      this.llmService,
    );
    this.adapter = adapter;
  }
}

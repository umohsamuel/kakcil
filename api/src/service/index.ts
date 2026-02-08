import type Adapter from "@/adapter";
import UserService from "./user";
import AuthenticationService from "./authentication";
import ChatService from "./chat";
import LLMService from "@/service/llm";
import CouncilService from "@/service/council";
import CouncilResponseService from "@/service/council/response";
import PaymentService from "./payment";

export default class Services {
  userService: UserService;
  authenticationService: AuthenticationService;
  llmService: LLMService;
  chatService: ChatService;
  councilService: CouncilService;
  councilResponseService: CouncilResponseService;
  paymentService: PaymentService;
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
    this.councilService = new CouncilService(
      adapter.councilAdapter,
      adapter.modelAdapter,
    );
    this.councilResponseService = new CouncilResponseService(
      adapter.councilResponseAdapter,
      adapter.modelAdapter,
    );
    this.paymentService = new PaymentService(adapter);
    this.adapter = adapter;
  }
}

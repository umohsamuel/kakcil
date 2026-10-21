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
    this.councilService = new CouncilService(
      adapter.councilAdapter,
      adapter.modelAdapter,
    );
    this.councilResponseService = new CouncilResponseService(
      adapter.councilResponseAdapter,
      adapter.modelAdapter,
    );
    this.chatService = new ChatService({
      chatRepository: adapter.chatAdapter,
      chatBranchRepository: adapter.chatBranchAdapter,
      councilResponseRepository: adapter.councilResponseAdapter,
      userApiKeyRepository: adapter.userApiKeyAdapter,
      modelRepository: adapter.modelAdapter,
      llmService: this.llmService,
      councilService: this.councilService,
      councilResponseService: this.councilResponseService,
    });
    this.paymentService = new PaymentService(adapter);
    this.adapter = adapter;
  }
}

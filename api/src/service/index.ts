import type Adapter from "@/adapter";
import UserService from "./user";
import AuthenticationService from "./authentication";
import ChatService from "./chat";
import VotingService from "./voting";

export default class Services {
  userService: UserService;
  authenticationService: AuthenticationService;
  chatService: ChatService;
  votingService: VotingService;
  adapter: Adapter;

  constructor(adapter: Adapter) {
    this.userService = new UserService(adapter.userAdapter);
    this.authenticationService = new AuthenticationService(adapter.userAdapter);
    this.chatService = new ChatService(adapter.llmAdapter, adapter.chatAdapter);
    this.votingService = new VotingService(adapter.llmAdapter);
    this.adapter = adapter;
  }
}

import type Adapter from "@/adapter";
import UserService from "./user";
import AuthenticationService from "./authentication";
import ChatService from "./chat";

export default class Services {
  userService: UserService;
  authenticationService: AuthenticationService;
  chatService: ChatService;
  adapter: Adapter;

  constructor(adapter: Adapter) {
    this.userService = new UserService(adapter.userAdapter);
    this.authenticationService = new AuthenticationService(adapter.userAdapter);
    this.chatService = new ChatService(adapter.llmAdapter);
    this.adapter = adapter;
  }
}

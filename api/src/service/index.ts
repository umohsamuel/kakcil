import type Adapter from "@/adapter";
import UserService from "./user";
import AuthenticationService from "./authentication";

export default class Services {
  userService: UserService;
  authenticationService: AuthenticationService;
  adapter: Adapter;

  constructor(adapter: Adapter) {
    this.userService = new UserService(adapter.userAdapter);
    this.authenticationService = new AuthenticationService(adapter.userAdapter);
    this.adapter = adapter;
  }
}

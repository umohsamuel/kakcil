import type Adapter from "@/adapter";
import UserService from "./user";

export default class Services {
  userService: UserService;
  adapter: Adapter;

  constructor(adapter: Adapter) {
    this.userService = new UserService(adapter.userAdapter);
    this.adapter = adapter;
  }
}

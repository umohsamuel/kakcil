import ExpressHTTP from "./http";
import type Adapter from "@/adapter";
import type Secrets from "@/infrastructure/secrets";
import Services from "@/service";

export default class Ports {
  httpPort: ExpressHTTP;
  secrets: Secrets;
  adapter: Adapter;
  services: Services;

  constructor(secrets: Secrets, services: Services, adapter: Adapter) {
    this.secrets = secrets;
    this.adapter = adapter;
    this.services = services;

    this.httpPort = new ExpressHTTP(secrets, services, adapter);
  }
}

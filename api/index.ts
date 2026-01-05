import Adapter from "@/adapter";
import { pgPoolConnection } from "./src/infrastructure/db/connection";
import Secrets from "./src/infrastructure/secrets";
import Ports from "@/ports";
import Services from "@/service";

class Kakcil {
  services: Services;
  adapter: Adapter;
  ports: Ports;

  constructor() {
    const secrets = new Secrets();
    const postgresPool = pgPoolConnection(secrets.dbConnectionCredentials);

    this.adapter = new Adapter(postgresPool, secrets);

    this.services = new Services(this.adapter);

    this.ports = new Ports(secrets, this.services, this.adapter);
  }

  run() {
    this.ports.httpPort.listen();
  }
}

const kakcil = new Kakcil();
kakcil.run();

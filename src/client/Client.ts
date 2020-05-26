import { Cordeno, CordenoOptions } from "./constant/cordeno.ts";
import { WebSocketManager } from "./ws/WebSocketManager.ts";
import { ReqHandler } from "./rest/ReqHandler.ts";
import { Message } from "./constructors/Message.ts";
import { ClientInfo } from "./constructors/ClientInfo.ts";
import { ClientEvent } from "./constructors/ClientEvent.ts";
import { Presence } from "./interfaces/discord.ts";

export class Client {
  private ws: WebSocketManager = new WebSocketManager(this);
  http: ReqHandler;
  options!: CordenoOptions;
  public user!: ClientInfo;

  private async *[Symbol.asyncIterator]() {
    for await (const payload of this.ws.queue) {
      if (typeof payload === "string") {
        yield payload;
        continue;
      }

      switch (payload.t) {
        case "MESSAGE_CREATE":
          yield ClientEvent(new Message(this, payload));
          break;
        default:
          break;
      }
    }
  }

  constructor(options: CordenoOptions) {
    this.options = options;
    if (!options.token) {
      throw new Error("A token must be specified when initiating `Client`");
    }

    this.ws.connect();
    this.http = new ReqHandler(options.token);
    this.user = new ClientInfo(this);
  }

  get version(): string {
    return Cordeno.Version;
  }

  async updatePresence(precense: Presence) {
    this.ws.presenceUpdate(precense);
  }
}

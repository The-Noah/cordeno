import { connectWebSocket, WebSocket, EventEmitter } from "../../../deps.ts";
import { Discord, Payload, OPCODE } from "../constant/discord.ts";
import { Cordeno } from "../constant/cordeno.ts";
import { Client } from "../Client.ts";
import { AsyncEventQueue } from "../Queue.ts";
import { Presence } from "../interfaces/discord.ts";

export class WebSocketManager extends EventEmitter {
  private socket!: WebSocket;
  private beatInterval!: number;
  private beatRecieved: boolean = true;
  public queue!: AsyncEventQueue<Payload>;

  constructor(private client: Client) {
    super();
    this.queue = new AsyncEventQueue();
  }

  async connect() {
    this.socket = await connectWebSocket(Discord.Endpoint);
    for await (const msg of this.socket) {
      if (typeof msg === "string") {
        const payload: Payload = JSON.parse(msg.toString());
        this.queue.post(payload);
        switch (payload.op) {
          case OPCODE.Hello: {
            this.identify();
            this.heartbeatInterval(payload.d.heartbeat_interval);
            this.emit("ready");
            break;
          }
          case OPCODE.HeartbeatACK: {
            break;
          }
        }
      } else {
      }
    }
  }

  async identify() {
    this.socket.send(JSON.stringify({
      op: OPCODE.Identify,
      d: {
        token: this.client.options.token,
        properties: {
          $os: "linux",
          $browser: `${Cordeno.Name} v${Cordeno.Version}`,
          $device: `${Cordeno.Name} v${Cordeno.Version}`,
        },
      },
    }));
  }

  async heartbeatInterval(rate: number) {
    if (this.beatRecieved) {
      this.beatInterval = setInterval(() => {
        this.heartbeat();
      }, rate);
      this.beatRecieved = false;
    } else {
      this.panic();
    }
  }

  async heartbeat() {
    this.socket.send(JSON.stringify({
      op: OPCODE.Heartbeat,
      d: null,
    }));
  }
  async panic() {
    //Reconnection code here
  }

  async presenceUpdate(precense: Presence) {
    this.socket.send(JSON.stringify({
      op: OPCODE.PresenceUpdate,
      d: { ...precense, since: null, afk: false },
    }));
  }
}

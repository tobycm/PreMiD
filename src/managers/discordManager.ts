import { Client } from "discord-rpc";
import { app } from "electron";

import { trayManager } from "../";
//* Import custom types
import PresenceData from "../../@types/PreMiD/PresenceData";
import { info } from "../util/debug";

export let rpcClients: Array<RPCClient> = [];

class RPCClient {
  clientId: string;
  currentPresence: PresenceData | null = null;
  client: Client;
  clientReady: boolean = false;

  constructor(clientId: string) {
    rpcClients.push(this);

    this.clientId = clientId;
    this.client = new Client({
      transport: "ipc",
    });

    this.client.once("ready", () => {
      this.clientReady = true;
      this.setActivity();
    });
    this.client.once(
      // @ts-ignore
      "disconnected",
      () =>
        (rpcClients = rpcClients.filter(
          (client) => client.clientId !== this.clientId,
        )),
    );

    this.client.login({ clientId: this.clientId }).catch(() => this.destroy());

    info(`Create RPC client (${this.clientId})`);
  }

  setActivity(presenceData: PresenceData | null = null) {
    presenceData = presenceData ?? this.currentPresence;

    if (!this.clientReady || !presenceData) return;

    if (presenceData.trayTitle)
      trayManager.tray.setTitle(presenceData.trayTitle);

    this.client
      .setActivity(presenceData.presenceData)
      .catch(() => this.destroy());
    info("setActivity");
  }

  clearActivity() {
    this.currentPresence = null;

    if (!this.clientReady) return;

    this.client.clearActivity().catch(() => this.destroy());
    trayManager.tray.setTitle("");
  }

  async destroy() {
    try {
      info(`Destroy RPC client (${this.clientId})`);
      if (this.clientReady) {
        this.client.clearActivity();
        this.client.destroy();
      }

      trayManager.tray.setTitle("");
      rpcClients = rpcClients.filter(
        (client) => client.clientId !== this.clientId,
      );
    } catch (err) {}
  }
}

/**
 * Sets the user's activity
 * @param presence PresenceData to set activity
 */
export function setActivity(presence: PresenceData) {
  let client = rpcClients.find((c) => c.clientId === presence.clientId);

  if (client) return client.setActivity(presence);

  client = new RPCClient(presence.clientId);
  client.currentPresence = presence;
}

/**
 * Clear a user's activity
 * @param clientId clientId of presence to clear
 */
export function clearActivity(clientId: string = "") {
  info("clearActivity");

  if (!clientId) return rpcClients.forEach((c) => c.clearActivity());

  rpcClients.find((c) => c.clientId === clientId)?.clearActivity();
}

export async function getDiscordUser() {
  const client = new Client({ transport: "ipc" });

  const { user } = await client.login({ clientId: "503557087041683458" });

  await client.destroy();

  return user;
}

app.once("will-quit", () => Promise.all(rpcClients.map((c) => c.destroy())));

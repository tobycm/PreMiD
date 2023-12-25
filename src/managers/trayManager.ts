import { app, Menu, shell, Tray } from "electron";
import { platform } from "os";
import { join } from "path";

import { trayManager } from "../";
import { checkForUpdate, update, updateAvailable } from "../util/updateChecker";
import { connected } from "./socketManager";

let trayIcon = join(__dirname, "../assets/tray/Icon@4x.png");

switch (platform()) {
  case "darwin":
    trayIcon = join(__dirname, "../assets/tray/IconTemplate.png");
  case "win32":
    trayIcon = join(__dirname, "../assets/tray/Icon.ico");
}

export class TrayManager {
  tray: Tray;

  constructor() {
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip(app.name);

    this.tray.on("right-click", () => this.update());
  }

  update() {
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          icon: join(
            __dirname,
            platform() === "darwin"
              ? "../assets/tray/IconTemplate.png"
              : "../assets/tray/Icon@4x.png",
          ),
          label: `${app.name} v${app.getVersion()}`,
          enabled: false,
        },
        {
          id: "connectInfo",
          label: `Extension - ${connected ? "Connected" : "Not connected"}`,
          enabled: false,
        },
        { type: "separator" },
        {
          label: "Presence Store",
          click: () => shell.openExternal("https://premid.app/store"),
        },
        { type: "separator" },
        {
          label: `Update ${app.name}!`,
          visible: updateAvailable,
          click: () => update(),
        },
        {
          label: "Check for Updates",
          click: () => checkForUpdate(false, true),
          visible: !updateAvailable,
        },
        {
          label: "Contributors",
          click: () => shell.openExternal("https://premid.app/contributors"),
        },
        { type: "separator" },
        { label: `Quit ${app.name}`, role: "quit" },
      ]),
    );
  }
}

app.once("quit", () => trayManager.tray.destroy());

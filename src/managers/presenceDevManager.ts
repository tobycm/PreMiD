import { app, dialog } from "electron";
import { readdirSync, readFileSync } from "fs";
import { extname } from "path";
import { info } from "../util/debug";
import { socket } from "./socketManager";

import chokidar from "chokidar";

let currentWatchPath = "",
  currentWatcher: chokidar.FSWatcher | null = null;

export async function watchDir(path: string) {
  currentWatchPath = path + "/";
  let files = readdirSync(path);

  if (currentWatcher) await currentWatcher.close();

  currentWatcher = chokidar.watch(currentWatchPath, {
    ignoreInitial: true,
    ignored: ["*.ts"],
  });

  currentWatcher.on("all", (eventName) => {
    files = readdirSync(currentWatchPath);

    console.log(eventName, currentWatchPath, files);

    readFiles(files, currentWatchPath);
  });

  readFiles(files, path);
}

async function readFiles(files: string[], path: string) {
  //* Send files to extension
  socket.emit("localPresence", {
    files: await Promise.all(
      files.map((file) => {
        if (extname(file) === ".json")
          return {
            file,
            contents: JSON.parse(readFileSync(`${path}/${file}`).toString()),
          };
        if (extname(file) === ".js")
          return { file, contents: readFileSync(`${path}/${file}`).toString() };
        return null;
      }),
    ),
  });
}

export async function openFileDialog() {
  //* Open file dialog
  //* If user cancels
  //* Unwatch all still watched files
  //* Watch directory
  app.focus();
  let oDialog = await dialog.showOpenDialog({
    title: "Select Presence Folder",
    message:
      "Please select the folder that contains the presence you want to load.\n(metadata.json, presence.js, iframe.js)",
    buttonLabel: "Load Presence",
    properties: ["openDirectory"],
  });
  if (oDialog.canceled) {
    //* Show debug
    //* return
    info("Presence load canceled.");
    return;
  }
  info(`Watching ${oDialog.filePaths[0]}`);

  watchDir(oDialog.filePaths[0]);
}

import AutoLaunch from "auto-launch";
import { app } from "electron";
import { info } from "../util/debug";
import { settings } from "./settingsManager";

//* Create autoLaunch object
const autoLaunch = new AutoLaunch({
  name: app.name,
  isHidden: true,
});

/**
 * Updates autoLaunch
 */
export async function update() {
  //* If app not packaged return
  //* Either enable/disable autolaunch
  if (!app.isPackaged) {
    //* Show debug
    //* Return
    info("Skipping autoLaunch.");
    return;
  }
  if (settings.get("autoLaunch", true)) autoLaunch.enable();
  else autoLaunch.disable();
}

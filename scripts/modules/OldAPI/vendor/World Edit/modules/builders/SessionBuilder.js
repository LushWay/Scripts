import {
  world,
  BlockLocation,
  MinecraftBlockTypes,
  Player,
} from "@minecraft/server";
import { XA } from "xapi.js";
import { configuration } from "../config.js";

class SessionBuilder {
  data(player) {
    return JSON.parse(
      XA.Entity.getTagStartsWith(player, configuration.DATA_PREFIX + ":") ??
        "{}"
    );
  }

  set(player, key, value) {
    let data = this.data(player);
    player.removeTag(`${configuration.DATA_PREFIX}:${JSON.stringify(data)}`);
    data[key] = value;
    player.addTag(`${configuration.DATA_PREFIX}:${JSON.stringify(data)}`);
  }

  get(player, key) {
    const data = this.data(player);
    return data[key];
  }
}
export const SessionBuild = new SessionBuilder();

import { SA } from "../../index.js";
import { XA } from "xapi.js";

const score = "c",
  scoreName = "§aShp1nat §6Coins";

SA.Utilities.time.setTickInterval(() => {
  SA.Build.chat.runCommand(
    `scoreboard objectives add ${score} dummy "${scoreName}"`
  );
}, 20);

export class Wallet {
  constructor(player) {
    this.w = player;
  }
  balance() {
    return SA.Build.entity.getScore(this.w, score);
  }
  set(count) {
    try {
      this.w.runCommand(`scoreboard players set @s ${score} ${count}`);
    } catch (error) {}
  }
  add(count) {
    try {
      this.w.runCommand(`scoreboard players add @s ${score} ${count}`);
    } catch (error) {}
  }
}

import { SA } from "../../index.js";
import { XA, setTickInterval} from "xapi.js";

const score = "c",
  scoreName = "§aShp1nat §6Coins";

setTickInterval(() => {
  XA.world.runCommand(
    `scoreboard objectives add ${score} dummy "${scoreName}"`
  );
}, 20);

export class Wallet {
  constructor(player) {
    this.w = player;
  }
  get balance() {
    return SA.Build.entity.getScore(this.w, score);
  }
  /**
   * @param {number} count
   */
  set balance(count) {
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

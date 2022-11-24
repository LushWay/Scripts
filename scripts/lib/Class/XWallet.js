import { Player, world } from "@minecraft/server";

const score = "c";
const scoreName = "§aShp1nat §6Coins";

const obj = world.scoreboard.addObjective(score, scoreName);

export class Wallet {
  /**
   *
   * @param {Player} player
   */
  constructor(player) {
    this.w = player;
  }
  get balance() {
    try {
      return obj.getScore(this.w.scoreboard);
    } catch (e) {
      return 0;
    }
  }
  /**
   * @param {number} count
   */
  set balance(count) {
    try {
      this.w.runCommand(`scoreboard players set @s ${score} ${count}`);
    } catch (error) {}
  }
  /**
   *
   * @param {string} count
   */
  add(count) {
    try {
      this.w.runCommand(`scoreboard players add @s ${score} ${count}`);
    } catch (error) {}
  }
}

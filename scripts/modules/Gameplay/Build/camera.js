import { system, Player } from "@minecraft/server";
import { ModalForm } from "xapi.js";

/**
 * @typedef {{
 *   pos: Vector3
 * }} CameraDB
 */

system.runPlayerInterval(
  (player) => {
    /** @type {PlayerDB<CameraDB>} */
    const { data, save } = player.db();

    if (data.pos) {
    }
  },
  "camera",
  20
);

new XCommand({ name: "camera", role: "admin" }).executes((ctx) => {});

/**
 * @param {Player} player
 */
function setupCameraForm(player) {
  new ModalForm("").show(player, (ctx) => {});
}

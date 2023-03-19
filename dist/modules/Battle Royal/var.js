import { XA } from "../../xapi.js";
/**
 * @type {Object<string, boolean>}
 */
export const quene = {};
export const BR_CONFIG = XA.WorldOptions("BattleRoyal", {
    pos: { desc: "x y z", value: "" },
    gamepos: { desc: "x y", value: "" },
    time: { desc: "Время игры в формате MM:SS (15:00)", value: "15:00" },
});

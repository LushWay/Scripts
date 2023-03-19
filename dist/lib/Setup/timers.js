import { Player, system, world } from "@minecraft/server";
import { handle } from "../../xapi.js";
import { stackParse } from "../Class/Error.js";
import { benchmark } from "../XBenchmark.js";
/**
 * Active timers
 * @type {Record<string | number, any>}
 */
const TIMERS = {};
/**
 * @type {Record<string, string>}
 */
export const TIMERS_PATHES = {};
/**
 * It runs a function after a certain amount of ticks
 * @param {number} ticks - The amount of ticks to wait before running the callback.
 * @param {Function} callback - The function to be called after the timeout.
 * @param {boolean} [loop] - Whether or not the timeout should loop.
 * @param {string | number} [id] - The id of the timeout.
 * @returns A function thats stops a timeout.
 */
function Timeout(ticks, callback, loop, id = new Error().stack, path = stackParse(6, [], new Error().stack)) {
    TIMERS[id] ?? (TIMERS[id] = 0);
    const visual_id = `${id} (${loop ? "loop " : ""}${ticks} ticks)`;
    TIMERS_PATHES[visual_id] ?? (TIMERS_PATHES[visual_id] = path);
    function tick() {
        if (TIMERS[id] === "stop")
            return;
        TIMERS[id]++;
        if (TIMERS[id] >= ticks) {
            TIMERS[id] = 0;
            const end = benchmark(visual_id, "timers");
            handle(callback, "Timeout");
            const took_ticks = ~~(end() / 20);
            if (took_ticks > ticks)
                console.warn(`Found slow script at:\n${path}`);
            if (!loop)
                return;
        }
        system.run(tick);
    }
    tick();
    return function stop() {
        TIMERS[id] = "stop";
    };
}
/**
 *
 * @param {(plr: Player) => void} callback
 */
function forPlayers(callback) {
    for (const player of world.getPlayers())
        callback(player);
}
/**
 * Returns a promise that will be resolved after given time
 * @param {number} time time in ticks
 * @returns {Promise<void>}
 */
export const sleep = (time) => new Promise((resolve) => setTickTimeout(() => resolve(), time, "sleep"));
/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickInterval(callback, ticks = 0, name) {
    return Timeout(ticks, callback, true, name);
}
/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickTimeout(callback, ticks = 1, name) {
    return Timeout(ticks, callback, false, name ?? Date.now());
}
/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerInterval(callback, ticks = 0, name) {
    return Timeout(ticks, () => forPlayers(callback), true, name);
}
/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerTimeout(callback, ticks = 1, name) {
    return Timeout(ticks, () => forPlayers(callback), false, name ?? Date.now());
}

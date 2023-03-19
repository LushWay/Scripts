/**
 * Returns a Before chat events augments
 * @example this.getChatAugments(BeforeChatEvent)
 * @param {string} message
 * @param {string} prefix
 * @returns {string[]}
 */
export function getChatAugments(message: string, prefix: string): string[];
/**
 * Sends a command not found message to a player
 * @param {Player} player  player to send message to
 * @param {string} command
 * @returns {void}
 */
export function commandNotFound(player: Player, command: string): void;
/**
 * Sends a command not found message to a player
 * @param {Player} player  player to send message to
 * @param {import("./index.js").XCommand} command
 * @returns {void}
 */
export function noPerm(player: Player, command: import("./index.js").XCommand): void;
/**
 * Sends a syntax failure message to player
 * @param {Player} player  undefined
 * @param {import("./index.js").XCommand} command  undefined
 * @param {string[]} args  undefined
 * @param {number} i  undefined
 * @returns {void}
 */
export function commandSyntaxFail(player: Player, command: import("./index.js").XCommand, args: string[], i: number): void;
/**
 * Returns a location of the inputed aguments
 * @example parseLocationAugs(["~1", "3", "^7"], { location: [1,2,3] , viewVector: [1,2,3] })
 * @param {[x: string, y: string, z: string]} a0
 * @param {{ location: Vector3; getViewDirection(): Vector3 }} data
 * @returns {{x: number, y: number, z: number}}
 */
export function parseLocationAugs([x, y, z]: [x: string, y: string, z: string], data: {
    location: Vector3;
    getViewDirection(): Vector3;
}): {
    x: number;
    y: number;
    z: number;
};
/**
 * Sends a callback back to the command
 * @param {string[]} cmdArgs the args that the command used
 * @param {import("./index.js").XCommand<any>[]} args args to use
 * @param {BeforeChatEvent} event
 * @param {import("./index.js").XCommand<any>} baseCommand
 */
export function sendCallback(cmdArgs: string[], args: import("./index.js").XCommand<any>[], event: BeforeChatEvent, baseCommand: import("./index.js").XCommand<any>): void;
import { Player } from "@minecraft/server";
import { BeforeChatEvent } from "@minecraft/server";

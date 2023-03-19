/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickInterval(callback: Function, ticks: number, name: string): () => void;
/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickTimeout(callback: Function, ticks: number, name: string): () => void;
/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerInterval(callback: (player: Player) => void, ticks: number, name: string): () => void;
/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerTimeout(callback: (player: Player) => void, ticks: number, name: string): () => void;
/**
 * @type {Record<string, string>}
 */
export const TIMERS_PATHES: Record<string, string>;
export function sleep(time: number): Promise<void>;
import { Player } from "@minecraft/server";

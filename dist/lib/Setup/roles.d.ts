/**
 * Gets the role of this player
 * @param  {Player | string} playerID player or his id to get role from
 * @returns {keyof typeof ROLES}
 * @example getRole("23529890")
 */
export function getRole(playerID: Player | string): keyof typeof ROLES;
/**
 * Sets the role of this player
 * @example setRole("342423452", "admin")
 * @param {Player | string} player
 * @param {keyof typeof ROLES} role
 * @returns {void}
 */
export function setRole(player: Player | string, role: keyof typeof ROLES): void;
/**
 * Checks if player role included in given array
 * @param {string} playerID
 * @param {keyof typeof ROLES} role
 */
export function IS(playerID: string, role: keyof typeof ROLES): boolean;
export namespace ROLES {
    const member: number;
    const admin: number;
    const moderator: number;
    const builder: number;
}
/** @type {Record<keyof typeof ROLES, string>}} */
export const T_roles: Record<keyof typeof ROLES, string>;
import { Player } from "@minecraft/server";

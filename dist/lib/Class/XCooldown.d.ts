export class XCooldown {
    /**
     * Generates a unique key for the cooldown in the database
     * @param {string} name - The name of the cooldown
     * @param {string} ID - The ID of the player or source related to the cooldown
     * @returns {string} - The generated key
     */
    static genDBkey(name: string, ID: string): string;
    /**
     * Parses the remaining time in milliseconds into a more human-readable format
     * @param {number} ms - Milliseconds to parse
     * @returns {{ parsedTime: string, type: string }} - An object containing the parsed time and the type of time (e.g. "days", "hours", etc.)
     */
    static getRemainingTime(ms: number): {
        parsedTime: string;
        type: string;
    };
    /**
     *
     * @param {string} digit
     * @param {[string, string, string]} _ 1 секунда 2 секунды 5 секунд
     * @returns
     */
    static getT(digit: string, [one, few, more]: [string, string, string]): string;
    /**
     * create class for manage player cooldowns
     * @param {IAbstactDatabase} db Database to store cooldowns
     * @param {string} prefix Preifx of the cooldown
     * @param {string | Player} source id or player that used for generate key and tell messages
     * @param {number} time Time in ms
     */
    constructor(db: IAbstactDatabase, prefix: string, source: string | Player, time: number);
    /**
     * @type {IAbstactDatabase}
     * @private
     */
    private db;
    /**
     * @type {string}
     * @private
     */
    private key;
    /**
     * @type {number}
     * @private
     */
    private time;
    /**
     * @type {Player | undefined}
     */
    player: Player | undefined;
    update(): void;
    /**
     * DB requred!
     */
    get statusTime(): number | "EXPIRED";
    isExpired(): boolean;
    get expired(): boolean;
    expire(): void;
}
import { Player } from "@minecraft/server";

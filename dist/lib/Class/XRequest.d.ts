export class XRequest {
    /**
     * Generates unique DB key
     * @param {string} prefix
     * @param {string} ID
     */
    static genDBkey(prefix: string, ID: string): string;
    /**
     * This class is used to help manage requests for specified id in db
     * @param {IAbstactDatabase} db - DB to store request data
     * @param {string} prefix - Prefix of request type.
     * @param {string} ID - May be player.id or any string
     */
    constructor(db: IAbstactDatabase, prefix: string, ID: string);
    /**
     * DB to store requests across the sessions
     * @type {IAbstactDatabase}
     * @private
     */
    private db;
    /**
     * Unique key for db
     * @type {string}
     * @private
     */
    private key;
    /**
     * Returns all active ids
     * @returns {Set<string>}
     */
    get reqList(): Set<string>;
    /**
     * Adds ID to request list and saves it to db
     * @param {string} ID
     */
    createRequest(ID: string): void;
    /**
     * Deletes request from db
     * @param {string} ID - ID of request
     */
    deleteRequest(ID: string): void;
}

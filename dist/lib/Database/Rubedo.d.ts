/**
 * @template {string} [Key = string]
 * @template [Value=any]
 */
export class Database<Key extends string = string, Value = any> {
    static tablesInited: boolean;
    static initAllTables(): Promise<void[]>;
    /** @type {Record<string, Database<any, any>>} */
    static instances: Record<string, Database<any, any>>;
    /**
     * Creates a table entity that is used for data storage
     * @param {string} tableName  undefined
     * @param {number} [index] if not specified no index will be set
     * @returns {Entity} *
     */
    static createTableEntity(tableName: string, index?: number): Entity;
    /**
     * Gets all table Entities associated with this tableName
     * @param {string} tableName  undefined
     * @returns {Entity[]} *
     */
    static getTableEntities(tableName: string): Entity[];
    /**
     *
     * @param {string} tableName
     */
    constructor(tableName: string);
    /**
     * Data saved in memory
     * @type {{ [key in Key]: Value } | null}
     * @private
     */
    private MEMORY;
    tableName: string;
    initPromise: Promise<void>;
    /**
     * Saves data into this database
     * @private
     */
    private save;
    /**
     * Grabs all data from this table
     * @private
     */
    private init;
    noMemory: boolean;
    stringifiedData: string;
    isInited: boolean;
    /**
     * Sets a key to a value in this table
     * @param {Key} key  undefined
     * @param {Value} value  undefined
     */
    set(key: Key, value: Value): Promise<void>;
    /**
     * Gets a value from this table
     * @param {Key} key  undefined
     * @returns {Value} the keys corresponding key
     */
    get(key: Key): Value;
    /**
     * Shorthand for db.get(); and db.set(); pair
     * @param {Key} key
     * @example ```js
     * // Get work
     * const {data, save} = db.work(key)
     *
     * // Change values
     * data.value = 10
     *
     * data.obj = { value2: 1 }
     *
     * // Save without specify key and data
     * save()
     * ```
     */
    work(key: Key): {
        data: Value;
        save: () => Promise<void>;
    };
    /**
     * Get all the keys in the table
     * @returns {Key[]}
     */
    keys(): Key[];
    /**
     * Get all the values in the table
     * @returns {Value[]}
     */
    values(): Value[];
    /**
     * Check if the key exists in the table
     * @param {Key} key  the key to test
     * @returns {boolean}
     */
    has(key: Key): boolean;
    /**
     * Saves data into this database
     * @param {{ [key in Key]: Value; }} collection
     */
    set collection(arg: { [key in Key]: Value; });
    /**
     * Gets all the keys and values
     */
    get collection(): { [key in Key]: Value; };
    /**
     * Delete the key from the table
     * @param {Key} key  the key to delete
     */
    delete(key: Key): Promise<void>;
    /**
     * Clear everything in the table
     */
    clear(): Promise<void>;
}
import { Entity } from "@minecraft/server";

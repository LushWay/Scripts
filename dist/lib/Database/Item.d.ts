export class XItemDatabase {
    /**
     * The name of the table
     * @param {string} TABLE_NAME
     */
    constructor(TABLE_NAME: string);
    TABLE_NAME: string;
    /**
     * Grabs all database entitys
     * @returns {Array<Entity>}
     * @private
     */
    private get ENTITIES();
    /**
     * Returns all items that are stored
     * @returns {Array<ItemStack>}
     * @private
     */
    private get ITEMS();
    items(): ItemStack[];
    /**
     * Gets a item by id from inv
     * @param {string} id
     */
    get(id: string): ItemStack;
    /**
     * Saves a item to the database
     * @param {ItemStack} item
     * @returns {string} an id to grab the item
     */
    add(item: ItemStack, id?: any): string;
    /**
     * deletes a item from the chests
     * @param {string} id
     * @returns {boolean} If it deleted or not
     */
    delete(id: string): boolean;
}
import { ItemStack } from "@minecraft/server";

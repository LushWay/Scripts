export namespace XEntity {
    /**
     * Gets player name from player database with specific ID
     * @param {string} ID
     */
    function getNameByID(ID: string): any;
    /**
     * Checks if position is in radius
     * @param {Vector3} center Center of radius
     * @param {Vector3} pos Position to check
     * @param {number} r Radius
     * @returns {boolean}
     */
    function inRadius(center: Vector3, pos: Vector3, r: number): boolean;
    /**
     * Get entitie(s) at a position
     * @param {{x: number, y: number, z: number}} p0 position of the entity
     * @param {string} dimension Dimesion of the entity
     * @returns {Array<Entity>}
     * @example EntityBuilder.getEntityAtPos({0, 5, 0} 'nether');
     */
    function getAtPos({ x, y, z }: {
        x: number;
        y: number;
        z: number;
    }, dimension?: string): Entity[];
    /**
     * Returns a location of the inputed aguments
     * @param {{location: Vector3}} entity your using
     * @param {number} [n] how many you want to get
     * @param {number} [maxDistance] max distance away
     * @param {string} [type] type of entity you want to get
     * @returns {Array<Entity>}
     * @example getClosetsEntitys(Entity, n=1, maxDistance = 10, type = Entity.type)
     */
    function getClosetsEntitys(entity: {
        location: Vector3;
    }, maxDistance?: number, type?: string, n?: number, shift?: boolean): Entity[];
    /**
     * Returns a location of the inputed aguments
     * @param {Entity} entity your using
     * @param {string} value what you want to search for
     * @example getTagStartsWith(Entity, "stuff:")
     */
    function getTagStartsWith(entity: Entity, value: string): string;
    /**
     * Returns a location of the inputed aguments
     * @param {Entity} entity your using
     * @param {string} value what you want to search for
     * @example removetTagStartsWith(Entity, "stuff:")
     */
    function removeTagsStartsWith(entity: Entity, value: string): any;
    /**
     * Get score of an entity
     * @param {Entity} entity you want to test
     * @param {string} objective Objective name you want to search
     * @returns {number} 0
     * @example getScore(Entity, 'Money');
     */
    function getScore(entity: Entity, objective: string): number;
    /**
     * Tests if a entity is dead
     * @param {{hasComponent(s: string): boolean; getComponent(s: string): any}} entity entity you want to test
     * @returns {boolean}
     * @example isDead(Entity);
     */
    function isDead(entity: {
        hasComponent(s: string): boolean;
        getComponent(s: string): any;
    }): boolean;
    /**
     * Gets items count from inventory
     * @param {Entity} entity entity from you want to get
     * @param {string} id
     * @returns {number}
     */
    function getItemsCount(entity: Entity, id: string): number;
    /**
     *
     * @param {Player} entity
     * @param {0 | "armor" | "armor.chest" | "armor.feet" | "armor.legs" | "slot.enderchest" | "weapon.mainhand" | "weapon.offhand"} location
     * @param {string} [itemId]
     * @returns
     */
    function hasItem(entity: Player, location: 0 | "armor" | "armor.chest" | "armor.feet" | "armor.legs" | "slot.enderchest" | "weapon.mainhand" | "weapon.offhand", itemId?: string): Promise<boolean>;
    /**
     * Gets the inventory of a entity
     * @param {Entity} entity entity you want to get
     * @returns {Container}
     */
    function getI(entity: Entity): Container;
    /**
     * Gets a players held item
     * @param {Player} player player you want to get
     * @returns {ItemStack}
     * @example getHeldItem(Player);
     */
    function getHeldItem(player: Player): ItemStack;
    /**
     * Despawns a entity
     * @param {Entity} entity entity to despawn
     */
    function despawn(entity: Entity): void;
    /**
     * Finds a player by name or ID
     * @param {string} name
     * @return {Player | undefined}
     */
    function fetch(name: string): Player;
}
import { Entity } from "@minecraft/server";
import { Player } from "@minecraft/server";
import { Container } from "@minecraft/server";
import { ItemStack } from "@minecraft/server";

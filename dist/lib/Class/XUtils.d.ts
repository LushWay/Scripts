export namespace XUtils {
    /**
     * @param {string | symbol | number} str
     * @param {{[]: any}} obj
     * @returns {str is keyof obj}
     */
    function isKeyof(str: string | number | symbol, obj: {}): str is never;
    /**
     * Generates a generator of either BlockLocation or Vector3 objects between two provided Vector3 objects
     * @param {Vector3} loc1 - starting Vector3 point
     * @param {Vector3} loc2 - ending Vector3 point
     * @returns {Generator<Vector3, void, unknown>} - generator of either BlockLocation or Vector3 objects
     */
    function safeBlocksBetween(loc1: Vector3, loc2: Vector3): Generator<Vector3, void, unknown>;
    /**
     * Calculates the total number of blocks in a 3D space defined by two Vector3 locations.
     * @param {Vector3} loc1 - The first Vector3 location defining the space.
     * @param {Vector3} loc2 - The second Vector3 location defining the space.
     * @returns {number} The total number of blocks in the defined space.
     */
    function getBlocksCount(loc1: Vector3, loc2: Vector3): number;
    /**
     * Converts a location to a block location
     * @param {Vector3} loc a location to convert
     */
    function floorVector(loc: Vector3): {
        x: number;
        y: number;
        z: number;
    };
    /**
     * Returns the block data of a block.
     * @param {Block} block - Block to get data
     * @returns {number} Data
     */
    function getBlockData(block: Block): number;
    /**
     *
     * @param {Player} player
     */
    function selectBlock(player: Player): Promise<any>;
    /**
     * @param {string} id
     */
    function getBlockTexture(id: string): string;
    /**
     * @template Func, [This = any]
     * @param {Func} func
     * @param {This} context
     * @returns {Func}
     */
    function TypedBind<Func, This = any>(func: Func, context: This): Func;
}
import { Block } from "@minecraft/server";
import { Player } from "@minecraft/server";

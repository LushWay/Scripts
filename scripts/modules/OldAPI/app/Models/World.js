import {
  world,
  BlockLocation,
  Player,
  Entity,
  Dimension,
  PropertyRegistry,
  World,
} from "@minecraft/server";

export class WorldBuilder {
  /**
   * Get list of players in game
   * @param {String} dimension dimension id you want to list
   * @returns {Array<string>}
   * @example PlayerBuilder.list();
   */
  list(dimension = null) {
    if (dimension)
      return [...world.getDimension(dimension).getPlayers()].map(
        (player) => player.name
      );
    return [...world.getPlayers()].map((player) => player.name);
  }
  /**
   * Look if player is in the game
   * @param {typeof Player.name} player Player you are looking for
   * @param {string} dimension dimension id you want to look
   * @returns {boolean}
   * @example PlayerBuilder.has('notbeer');
   */
  has(player, dimension = null) {
    return this.list(dimension).includes(player);
  }
  /**
   * Fetch an online players data
   * @param {typeof Player.name} player players name
   * @returns {Player | null}
   */
  fetch(player) {
    return [...world.getPlayers()].find((plr) => plr.name === player);
  }
  /**
   * Get entitie(s) at a position
   * @param {number} x X position of the entity
   * @param {number} y Y position of the entity
   * @param {number} z Z position of the entity
   * @param {string} dimension Dimesion of the entity
   * @returns {Entity[]}
   * @example EntityBuilder.getEntityAtPos(0, 5, 0, { dimension: 'nether', ignoreType: ['minecraft:player']});
   */
  getEntityAtPos(x, y, z, dimension = "overworld") {
    try {
      return world
        .getDimension(dimension)
        .getEntitiesAtBlockLocation(new BlockLocation(x, y, z));
    } catch (error) {
      return [];
    }
  }

  /**
   * Returns all entitys
   * @param {String} type id of the entities to get
   * @returns {Array<Entity>}
   */
  getEntitys(type = null) {
    /**
     * @type {Array<Entity>}
     */
    let entitys = [];
    for (const dimension of ["overworld", "nether", "the end"]) {
      [...world.getDimension(dimension).getEntities()].forEach((e) =>
        entitys.push(e)
      );
    }
    if (type) return entitys.filter((e) => e.typeId == type);
    return entitys;
  }
}
export const WorldBuild = new WorldBuilder();

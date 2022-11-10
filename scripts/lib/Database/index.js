import { CONFIG_DB } from "config.js";
import { ThrowError } from "xapi.js";
import {
  DynamicPropertiesDefinition,
  world,
  MinecraftEntityTypes,
  Player,
} from "@minecraft/server";

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
  /**
   *
   * @param {DynamicPropertiesDefinition} s
   * @param {string} p
   * @returns
   */
  const add = (s, p) => s.defineString(p, 4294967295);

  const e = new DynamicPropertiesDefinition();
  for (const prop of Object.values(CONFIG_DB.world)) add(e, prop);
  propertyRegistry.registerWorldDynamicProperties(e);

  const e2 = new DynamicPropertiesDefinition();
  for (const prop of Object.values(CONFIG_DB.player)) add(e2, prop);
  propertyRegistry.registerEntityTypeDynamicProperties(
    e2,
    MinecraftEntityTypes.player
  );
});

/**
 * @param {object} source
 * @param {string | any} key
 * @returns {object}
 */
function GetData(source, key) {
  /** @type {import("./types.js").Source} */
  const t = source;

  let res = {};

  try {
    if (!key) throw new Error("No key!");
    const a = t.getDynamicProperty(key);
    if (typeof a !== "string") return res;
    res = JSON.parse(a);
  } catch (e) {
    ThrowError({ message: `${e.message ?? e} key: ${key}`, stack: e.stack });
  }

  return res;
}

/**
 * @param {object} source
 * @param {string | any} key
 * @param {object} data
 * @returns {object}
 */
function SafeData(source, key, data) {
  /** @type {import("./types.js").Source} */
  const t = source;

  try {
    if (!key) throw new Error("No key!");
    t.setDynamicProperty(key, JSON.stringify(data));
  } catch (e) {
    ThrowError({ message: `${e.message ?? e} key: ${key}`, stack: e.stack });
  }
}

/**
 * @template [S = import("./types.js").Source]
 */
export class IDBClass {
  #source;
  #key;
  /**
   * @param {S} source
   * @param {S extends Player ? import("./types.js").DBkey.player : import("./types.js").DBkey.world} name
   */
  constructor(source, name) {
    this.#source = source;
    this.#key = name;
    this.#key =
      source instanceof Player
        ? CONFIG_DB.player[this.#key]
        : CONFIG_DB.world[this.#key];
  }
  get data() {
    return GetData(this.#source, this.#key);
  }
  /**
   *
   * @param {string} key
   * @returns {import("./types.js").DBvalue}
   */
  get(key) {
    return this.data[key];
  }
  /**
   *
   * @param {string} key
   * @param {import("./types.js").DBvalue} value
   * @returns {void}
   */
  set(key, value) {
    const data = this.data;
    data[key] = value;
    SafeData(this.#source, this.#key, data);
  }
  values() {
    return Object.values(this.data);
  }
  keys() {
    return Object.keys(this.data);
  }
  /**
   *
   * @param {string} key
   * @returns
   */
  has(key) {
    return this.keys().includes(key);
  }
  /**
   *
   * @param {string} key
   * @returns
   */
  delete(key) {
    const data = this.data;
    const result = delete data[key];
    SafeData(this.#source, this.#key, data);
    return result;
  }
}

/**
 * @template [S = import("./types.js").Source]
 */
export class CDBClass {
  #source;
  #key;
  /**@type {object} */
  #CachedData;
  /**
   * @param {S} source
   * @param {S extends Player ? import("./types.js").DBkey.player : import("./types.js").DBkey.world} name
   */
  constructor(source, name) {
    this.#source = source;
    this.#key = name;
  }
  get data() {
    this.#CachedData = GetData(this.#source, this.#key);
    return this.#CachedData;
  }
  safe() {
    SafeData(this.#source, this.#key, this.#CachedData);
  }
}

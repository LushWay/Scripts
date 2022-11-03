import { CONFIGDB } from "config.js";
import { ThrowError, XA } from "xapi.js";
import {
  DynamicPropertiesDefinition,
  world,
  MinecraftEntityTypes,
  World,
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
  for (const prop of Object.values(CONFIGDB.world)) add(e, prop);
  propertyRegistry.registerWorldDynamicProperties(e);

  const e2 = new DynamicPropertiesDefinition();
  for (const prop of Object.values(CONFIGDB.player)) add(e2, prop);
  propertyRegistry.registerEntityTypeDynamicProperties(
    e2,
    MinecraftEntityTypes.player
  );
});

/**
 * @param {object} source
 * @param {string} key
 * @returns {object}
 */
function GetData(source, key) {
  /** @type {import("./types.js").Source} */
  const t = source;

  let res = {};

  try {
    const a = t.getDynamicProperty(key);
    if (typeof a !== "string") throw "Property isnt a string";
    res = JSON.parse(a);
  } catch (e) {
    ThrowError({ message: e.message ?? e });
    // t.setDynamicProperty(key, "{}")
  }

  return res;
}

/**
 * @param {object} source
 * @param {string} key
 * @param {object} data
 * @returns {object}
 */
function SafeData(source, key, data) {
  /** @type {import("./types.js").Source} */
  const t = source;

  try {
    t.setDynamicProperty(key, JSON.stringify(data));
  } catch (e) {
    ThrowError({ message: e.message ?? e });
    // t.setDynamicProperty(key, "{}")
  }
}

/**
 * @template [S = import("./types.js").Source], [KEY = S extends typeof Player ? import("./types.js").DBkey.player : import("./types.js").DBkey.world ]
 */
class InstantDB {
  #source;
  #key;
  /**
   * @param {S} source
   * @param {KEY extends string ? KEY : string} name
   */
  constructor(source, name) {
    this.#source = source;
    this.#key = name;
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
}

/**
 * @template [S = import("./types.js").Source], [KEY = S extends typeof Player ? import("./types.js").DBkey.player : import("./types.js").DBkey.world ]
 */
class CacheDB {
  #source;
  #key;
  /**@type {object} */
  #CachedData;
  /**
   * @param {S} source
   * @param {KEY extends string ? KEY : string} name
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

export const CDBClass = CacheDB,
  IDBClass = InstantDB;

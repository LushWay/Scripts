import { world } from "@minecraft/server";
world.say("§9┌ §fLoading...");
let loading = Date.now();
// This need to be loaded before all another scripts
import "./lib/Setup/watchdog.js";
import "./lib/Setup/prototypes.js";
import { DIMENSIONS } from "./lib/List/dimensions.js";
import { onWorldLoad } from "./lib/Setup/loader.js";
// X-API methods
import { XEntity } from "./lib/Class/Entity.js";
import { XCooldown } from "./lib/Class/XCooldown.js";
import { XOptions, XPlayerOptions } from "./lib/Class/XOptions.js";
import { XRequest } from "./lib/Class/XRequest.js";
import { XCommand } from "./lib/Command/index.js";
import { Database } from "./lib/Database/Rubedo.js";
import { XItemDatabase } from "./lib/Database/Item.js";
import { emoji } from "./lib/Lang/emoji.js";
import { parse } from "./lib/Lang/parser.js";
import { text } from "./lib/Lang/text.js";
import { XRunCommand } from "./lib/XRunCommand.js";
import { CONFIG } from "./config.js";
import { XUtils } from "./lib/Class/XUtils.js";
import { load_modules } from "./lib/Module/loader.js";
import { handle } from "./lib/Setup/utils.js";
import "./modules/import.js";
/**
 * Class with all X-API features
 */
export class XA {
    /** @protected */
    constructor() { }
}
XA.Entity = XEntity;
XA.runCommandX = XRunCommand;
XA.Command = XCommand;
XA.Cooldown = XCooldown;
XA.Request = XRequest;
XA.Utils = XUtils;
XA.PlayerOptions = XPlayerOptions;
XA.WorldOptions = XOptions;
XA.Lang = {
    lang: text,
    emoji: emoji,
    parse: parse,
};
XA.tables = {
    /**
     * Database to save server roles
     * @type {Database<string, keyof typeof import("./lib/Setup/roles.js").ROLES>}
     */
    roles: new Database("roles"),
    /**
     * Database to store any player data
     * @type {Database<string, any>}
     */
    player: new Database("player"),
    /** @type {Database<string, any>} */
    basic: new Database("basic"),
    region: new Database("region"),
    buildRegion: new Database("buildRegion"),
    /** @type {Database<string, string>} */
    chests: new Database("chests"),
    kits: new Database("kits"),
    drops: new Database("drop"),
    i: new XItemDatabase("items"),
};
XA.dimensions = DIMENSIONS;
/** @type {{name?: string, id: string, watch?: boolean}[]} */
XA.objectives = [];
XA.state = {
    first_load: false,
    world_loaded: false,
    db_loaded: false,
    modules_loaded: false,
    load_time: "",
};
export * from "./lib/Setup/loader.js";
export * from "./lib/Setup/roles.js";
export * from "./lib/Setup/timers.js";
export * from "./lib/Setup/utils.js";
/**
 * Importing file from dir of the project
 * @param {string} path
 */
export const DIR_IMPORT = (path) => import(path);
world.events.playerJoin.subscribe(() => {
    if (Date.now() - loading < CONFIG.firstPlayerJoinTime) {
        XA.state.first_load = true;
    }
});
onWorldLoad(async () => {
    XA.state.world_loaded = true;
    await Database.initAllTables();
    XA.state.db_loaded = true;
    await load_modules();
    await handle(() => import("./lib/Setup/registryScore.js"));
    XA.state.modules_loaded = true;
    XA.state.load_time = ((Date.now() - loading) / 1000).toFixed(2);
    if (!XA.state.first_load)
        world.say(`§9└ §fDone in ${XA.state.load_time}`);
    else
        world.say(`§fFirst loaded in ${XA.state.load_time}`);
});

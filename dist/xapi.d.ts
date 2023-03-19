/**
 * Class with all X-API features
 */
export class XA {
    static Entity: {
        getNameByID(ID: string): any;
        inRadius(center: Vector3, pos: Vector3, r: number): boolean;
        getAtPos({ x, y, z }: {
            x: number;
            y: number;
            z: number;
        }, dimension?: string): import("@minecraft/server").Entity[];
        getClosetsEntitys(entity: {
            location: Vector3;
        }, maxDistance?: number, type?: string, n?: number, shift?: boolean): import("@minecraft/server").Entity[];
        getTagStartsWith(entity: import("@minecraft/server").Entity, value: string): string;
        removeTagsStartsWith(entity: import("@minecraft/server").Entity, value: string): any;
        getScore(entity: import("@minecraft/server").Entity, objective: string): number;
        isDead(entity: {
            hasComponent(s: string): boolean;
            getComponent(s: string): any;
        }): boolean;
        getItemsCount(entity: import("@minecraft/server").Entity, id: string): number;
        hasItem(entity: import("@minecraft/server").Player, location: 0 | "armor" | "armor.chest" | "armor.feet" | "armor.legs" | "slot.enderchest" | "weapon.mainhand" | "weapon.offhand", itemId?: string): Promise<boolean>;
        getI(entity: import("@minecraft/server").Entity): import("@minecraft/server").Container;
        getHeldItem(player: import("@minecraft/server").Player): import("@minecraft/server").ItemStack;
        despawn(entity: import("@minecraft/server").Entity): void;
        fetch(name: string): import("@minecraft/server").Player;
    };
    static runCommandX: typeof XRunCommand;
    static Command: typeof XCommand;
    static Cooldown: typeof XCooldown;
    static Request: typeof XRequest;
    static Utils: {
        isKeyof(str: string | number | symbol, obj: {}): str is never;
        safeBlocksBetween(loc1: Vector3, loc2: Vector3): Generator<Vector3, void, unknown>;
        getBlocksCount(loc1: Vector3, loc2: Vector3): number;
        floorVector(loc: Vector3): {
            x: number;
            y: number;
            z: number;
        };
        getBlockData(block: import("@minecraft/server").Block): number;
        selectBlock(player: import("@minecraft/server").Player): Promise<any>;
        getBlockTexture(id: string): string;
        TypedBind<Func, This = any>(func: Func, context: This): Func;
    };
    static PlayerOptions: typeof XPlayerOptions;
    static WorldOptions: typeof XOptions;
    static Lang: {
        lang: {
            "api.name": () => string;
            "api.error.unknown": () => string;
            "api.database.error.table_name": (a: any, b: any) => string;
            "api.utilities.formatter.error.ms": (a: any) => string;
            "api.Providers.form.invaildtype": (a: any, b: any) => string;
            "api.Providers.form.invaildFormtype": (a: any, b: any) => void;
            "br.start": (a: any, b: any, c: any) => string;
            "br.end.time": (a: any) => string;
            "br.end.spec": (a: any) => string;
            "br.end.winner": (a: any) => string;
            "br.end.looser": (a: any, b: any) => string;
            "br.end.draw": () => string;
            "shop.lore": (price: any, balance: any) => string[];
            "shop.notenought": (price: any, balance: any) => string;
            "shop.suc": (a: any, b: any, price: any, balance: any) => string;
            stats: (hrs: any, min: any, sec: any, ahrs: any, amin: any, asec: any, dhrs: any, dmin: any, dsec: any, kills: any, deaths: any, hget: any, hgive: any, bplace: any, Bbreak: any, fla: any) => string;
        };
        emoji: {
            food: string;
            armor: string;
            minecoin: string;
            token: string;
            buttons: {
                code_builder: string;
                immersive_reader: string;
                xbox: {
                    a: string;
                    b: string;
                    x: string;
                    y: string;
                    lb: string;
                    rb: string;
                    lt: string;
                    rt: string;
                    select: string;
                    start: string;
                    stick_left: string;
                    stick_right: string;
                    dpad_left: string;
                    dpad_right: string;
                    dpad_up: string;
                    dpad_down: string;
                };
                playstation: {
                    cross: string;
                    circle: string;
                    square: string;
                    triangle: string;
                    l1: string;
                    r1: string;
                    l2: string;
                    r2: string;
                    select: string;
                    start: string;
                    stick_left: string;
                    stick_right: string;
                    dpad_left: string;
                    dpad_right: string;
                    dpad_up: string;
                    dpad_down: string;
                };
                switch: {
                    a: string;
                    b: string;
                    x: string;
                    y: string;
                    l: string;
                    r: string;
                    zl: string;
                    zr: string;
                    "-": string;
                    "+": string;
                    stick_left: string;
                    stick_right: string;
                    dpad_left: string;
                    dpad_right: string;
                    dpad_up: string;
                    dpad_down: string;
                };
                windows: {
                    mouse_left: string;
                    mouse_right: string;
                    mouse_middle: string;
                    arrow_left: string;
                    arrow_right: string;
                    arrow_foward: string;
                    arrow_backward: string;
                    jump: string;
                    crouch: string;
                    fly_up: string;
                    fly_down: string;
                };
                windows_mr: {
                    grab_left: string;
                    grab_right: string;
                    menu: string;
                    stick_left: string;
                    stick_right: string;
                    touchpad_left: string;
                    touchpad_horizontal_left: string;
                    touchpad_vertical_left: string;
                    touchpad_right: string;
                    touchpad_horizontal_right: string;
                    touchpad_vertical_right: string;
                    trigger_left: string;
                    trigger_right: string;
                    windows: string;
                };
                rift: {
                    0: string;
                    a: string;
                    b: string;
                    grab_left: string;
                    grab_right: string;
                    stick_left: string;
                    stick_right: string;
                    trigger_left: string;
                    trigger_right: string;
                    x: string;
                    y: string;
                };
            };
        };
        parse: typeof parse;
    };
    static tables: {
        /**
         * Database to save server roles
         * @type {Database<string, keyof typeof import("./lib/Setup/roles.js").ROLES>}
         */
        roles: Database<string, keyof typeof import("./lib/Setup/roles.js").ROLES>;
        /**
         * Database to store any player data
         * @type {Database<string, any>}
         */
        player: Database<string, any>;
        /** @type {Database<string, any>} */
        basic: Database<string, any>;
        region: Database<string, any>;
        buildRegion: Database<string, any>;
        /** @type {Database<string, string>} */
        chests: Database<string, string>;
        kits: Database<string, any>;
        drops: Database<string, any>;
        i: XItemDatabase;
    };
    static dimensions: {
        "minecraft:overworld": import("@minecraft/server").Dimension;
        overworld: import("@minecraft/server").Dimension;
        "minecraft:nether": import("@minecraft/server").Dimension;
        nether: import("@minecraft/server").Dimension;
        "minecraft:the_end": import("@minecraft/server").Dimension;
        the_end: import("@minecraft/server").Dimension;
    };
    /** @type {{name?: string, id: string, watch?: boolean}[]} */
    static objectives: {
        name?: string;
        id: string;
        watch?: boolean;
    }[];
    static state: {
        first_load: boolean;
        world_loaded: boolean;
        db_loaded: boolean;
        modules_loaded: boolean;
        load_time: string;
    };
}
export * from "./lib/Setup/loader.js";
export * from "./lib/Setup/roles.js";
export * from "./lib/Setup/timers.js";
export * from "./lib/Setup/utils.js";
export function DIR_IMPORT(path: string): Promise<any>;
import { XRunCommand } from "./lib/XRunCommand.js";
import { XCommand } from "./lib/Command/index.js";
import { XCooldown } from "./lib/Class/XCooldown.js";
import { XRequest } from "./lib/Class/XRequest.js";
import { XPlayerOptions } from "./lib/Class/XOptions.js";
import { XOptions } from "./lib/Class/XOptions.js";
import { parse } from "./lib/Lang/parser.js";
import { Database } from "./lib/Database/Rubedo.js";
import { XItemDatabase } from "./lib/Database/Item.js";

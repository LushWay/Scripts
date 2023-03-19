var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _WorldEditBuilder_pos1, _WorldEditBuilder_pos2;
import { MolangVariableMap, Player, Vector } from "@minecraft/server";
import { DisplayError, sleep, XA } from "xapi.js";
import { CONFIG_WB } from "../../config.js";
import { Cuboid } from "../utils/Cuboid.js";
import { get } from "../utils/utils.js";
import { Structure } from "./StructureBuilder.js";
class WorldEditBuilder {
    get pos1() {
        return __classPrivateFieldGet(this, _WorldEditBuilder_pos1, "f");
    }
    set pos1(val) {
        __classPrivateFieldSet(this, _WorldEditBuilder_pos1, val, "f");
        if (__classPrivateFieldGet(this, _WorldEditBuilder_pos2, "f"))
            this.selectionCuboid = new Cuboid(val, __classPrivateFieldGet(this, _WorldEditBuilder_pos2, "f"));
    }
    get pos2() {
        return __classPrivateFieldGet(this, _WorldEditBuilder_pos2, "f");
    }
    set pos2(val) {
        __classPrivateFieldSet(this, _WorldEditBuilder_pos2, val, "f");
        if (__classPrivateFieldGet(this, _WorldEditBuilder_pos1, "f"))
            this.selectionCuboid = new Cuboid(__classPrivateFieldGet(this, _WorldEditBuilder_pos1, "f"), val);
    }
    constructor() {
        this.drawselection = CONFIG_WB.DRAW_SELECTION_DEFAULT;
        /** @type {Vector3} */
        _WorldEditBuilder_pos1.set(this, null);
        /** @type {Vector3} */
        _WorldEditBuilder_pos2.set(this, null);
        /**
         * @type {Structure[]}
         * @private
         */
        this.history = [];
        /**
         * @type {Structure[]}
         * @private
         */
        this.undos = [];
        /**
         * @type {{pos1:Vector3; pos2:Vector3; name:string}}
         * @private
         */
        this.current_copy = {
            pos1: null,
            pos2: null,
            name: "",
        };
    }
    drawSelection() {
        if (!this.drawselection || !this.selectionCuboid)
            return;
        const selectedSize = XA.Utils.getBlocksCount(this.selectionCuboid.min, this.selectionCuboid.max);
        if (selectedSize > CONFIG_WB.DRAW_SELECTION_MAX_SIZE)
            return;
        const { xMax, xMin, zMax, zMin, yMax, yMin } = this.selectionCuboid;
        const gen = XA.Utils.safeBlocksBetween(this.selectionCuboid.min, this.selectionCuboid.max);
        let step;
        while (!step?.done) {
            step = gen.next();
            if (!step.value)
                continue;
            const { x, y, z } = step.value;
            const q = ((x == xMin || x == xMax) && (y == yMin || y == yMax)) ||
                ((y == yMin || y == yMax) && (z == zMin || z == zMax)) ||
                ((z == zMin || z == zMax) && (x == xMin || x == xMax));
            if (q)
                XA.dimensions.overworld.spawnParticle("minecraft:endrod", { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, new MolangVariableMap());
        }
    }
    /**
     * Backups a location
     * @param {Vector3} pos1 Position 1 of cuboid location
     * @param {Vector3} pos2 Position 2 of cuboid location
     * @param {Structure[]} saveLocation Save location where you want the data to store your backup
     * @example backup(pos1, pos2, history);
     */
    async backup(pos1 = this.pos1, pos2 = this.pos2, saveLocation = this.history) {
        const structure = new Structure(CONFIG_WB.BACKUP_PREFIX, pos1, pos2);
        saveLocation.push(structure);
    }
    /**
     * Undoes the latest history save
     * @param {number} amount times you want to undo
     * @returns {string}
     * @example undo(2);
     */
    undo(amount = 1) {
        try {
            if (this.history.length < amount)
                amount = this.history.length;
            const backups = this.history.slice(-amount);
            for (const backup of backups.reverse()) {
                this.backup(backup.pos1, backup.pos2, this.undos);
                backup.load();
                this.history.splice(this.history.indexOf(backup), 1);
            }
            const e = XA.Cooldown.getT(amount.toString(), [
                "бэкап",
                "бэкапа",
                "бэкапов",
            ]);
            return `§b► §3Успешно отменен${amount.toString().endsWith("1") ? "" : "о"} §f${amount} §3${e}!`;
        }
        catch (error) {
            DisplayError(error);
            return `§4► §cНе удалось отменить`;
        }
    }
    /**
     * Redoes the latest history save
     * @returns {string}
     * @example redo();
     */
    redo(amount = 1) {
        try {
            if (this.undos.length < amount)
                amount = this.undos.length;
            const backups = this.undos.slice(-amount);
            for (const backup of backups.reverse()) {
                this.backup(backup.pos1, backup.pos2, this.undos);
                backup.load();
                this.undos.splice(this.undos.indexOf(backup), 1);
            }
            const e = XA.Cooldown.getT(amount.toString(), [
                "бэкап",
                "бэкапа",
                "бэкапов",
            ]);
            return `§b► §3Успешно возвращен${amount.toString().endsWith("1") ? "" : "о"} §f${amount} §3${e}!`;
        }
        catch (error) {
            DisplayError(error);
            return `§4► §cНе удалось вернуть`;
        }
    }
    /**
     * Copys The curret positions
     * @returns {Promise<string>}
     * @example copy();
     */
    async copy() {
        try {
            if (!this.selectionCuboid)
                return "§4► §cЗона для копирования не выделена!";
            const opt = await XA.runCommandX(`structure save ${CONFIG_WB.COPY_FILE_NAME} ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} false memory`);
            if (!opt)
                throw new Error(opt + "");
            this.current_copy = {
                pos1: this.pos1,
                pos2: this.pos2,
                name: CONFIG_WB.COPY_FILE_NAME,
            };
            return `§9► §rСкопированно из ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} to ${this.pos2.x} ${this.pos2.y} ${this.pos2.z}`;
        }
        catch (error) {
            DisplayError(error);
            return `§4► §cНе удалось скорпировать`;
        }
    }
    /**
     * Pastes a copy from memory
     * @param {Player} player player to execute on
     * @param {0 | 90 | 180 | 270} rotation Specifies the rotation when loading a structure
     * @param {"none" | "x" | "xz" | "z"} mirror Specifies the axis of mirror flip when loading a structure
     * @param {boolean} includesEntites Specifies whether including entites or not
     * @param {boolean} includesBlocks Specifies whether including blocks or not
     * @param {number} integrity Specifies the integrity (probability of each block being loaded). If 100, all blocks in the structure are loaded.
     * @param {string} seed Specifies the seed when calculating whether a block should be loaded according to integrity. If unspecified, a random seed is taken.
     * @returns {Promise<string>}
     * @example paste(Player, 0, "none", false, true, 100.0, "");
     */
    async paste(player, rotation = 0, mirror = "none", includesEntites = false, includesBlocks = true, integrity = 100.0, seed = "") {
        try {
            const dx = Math.abs(this.current_copy.pos2.x - this.current_copy.pos1.x);
            const dy = Math.abs(this.current_copy.pos2.y - this.current_copy.pos1.y);
            const dz = Math.abs(this.current_copy.pos2.z - this.current_copy.pos1.z);
            const pos2 = Vector.add(player.location, new Vector(dx, dy, dz));
            const loc = XA.Utils.floorVector(player.location);
            this.backup(loc, pos2);
            await player.runCommandAsync(`structure load ${CONFIG_WB.COPY_FILE_NAME} ~ ~ ~ ${String(rotation).replace("NaN", "0")}_degrees ${mirror} ${includesEntites} ${includesBlocks} ${integrity ? integrity : ""} ${seed ? seed : ""}`);
            return `§a► §rВставлено в ${loc.x} ${loc.y} ${loc.z}`;
        }
        catch (error) {
            DisplayError(error);
            return `§4► §cНе удалось вставить`;
        }
    }
    /**
     *
     * @param {string} block
     * @param {*} data
     * @param {*} replaceMode
     * @param {*} replaceBlock
     * @param {*} rbData
     * @returns
     */
    async fillBetween(block, data = -1, replaceMode, replaceBlock, rbData) {
        const startTime = Date.now();
        this.backup();
        const Cube = new Cuboid(this.pos1, this.pos2);
        const blocks = Cube.blocksBetween;
        let errors = 0;
        let all = 0;
        let fulldata = block;
        const add = (/** @type {string | number} */ s) => (fulldata += ` ${s}`);
        if (!isNaN(data))
            add(data);
        if (replaceMode) {
            add(replaceMode);
            if (replaceMode === "replace") {
                if (replaceBlock)
                    add(replaceBlock);
                if (!isNaN(rbData))
                    add(rbData);
            }
        }
        for (const cube of Cube.split(CONFIG_WB.FILL_CHUNK_SIZE)) {
            const result = await XA.runCommandX(`fill ${cube.pos1.x} ${cube.pos1.y} ${cube.pos1.z} ${cube.pos2.x} ${cube.pos2.y} ${cube.pos2.z} ${fulldata}`, { showError: true, showOutput: true });
            if (result === 0)
                errors++;
            all++;
            await sleep(1);
        }
        const endTime = get(Date.now() - startTime);
        let reply = `§3Заполненно §f${blocks} §3блоков ${endTime.parsedTime !== "0"
            ? `за §f${endTime.parsedTime} §3${endTime.type}.`
            : ""}`;
        if (replaceMode)
            reply += ` §3Режим заполнения: §b${replaceMode}`;
        if (replaceMode === "replace")
            reply += `§3, заполняемый блок: §f${replaceBlock} ${rbData ? rbData : ""}`;
        if (errors)
            return `§4► §7[§c${errors}§7|§f${all}§7] §cОшибок. ${reply}`;
        return `§b► ${reply}`;
    }
}
_WorldEditBuilder_pos1 = new WeakMap(), _WorldEditBuilder_pos2 = new WeakMap();
export const WorldEditBuild = new WorldEditBuilder();

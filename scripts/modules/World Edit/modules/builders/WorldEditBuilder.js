import { BlockLocation, Player } from "@minecraft/server";
import { sleep, ThrowError, XA } from "xapi.js";
import { WB_CONFIG } from "../../config.js";
import { Cuboid } from "../utils/Cuboid.js";
import { get } from "../utils/utils.js";
import { Structure } from "./StructureBuilder.js";

class WorldEditBuilder {
	drawselection = WB_CONFIG.DRAW_SELECTION_DEFAULT;
	pos1 = { x: 0, y: 0, z: 0 };
	pos2 = { x: 0, y: 0, z: 0 };

	/**
	 * @type {Structure[]}
	 * @private
	 */
	history = [];

	/**
	 * @type {Structure[]}
	 * @private
	 */
	undos = [];

	/**
	 * @type {{pos1:Vector3; pos2:Vector3; name:string}}
	 * @private
	 */
	current_copy = {
		pos1: null,
		pos2: null,
		name: "",
	};

	constructor() {}

	drawSelection() {
		if (!this.drawselection) return;
		return [
			`event entity @e[type=f:t,name="${WB_CONFIG.DRAW_SELECTION1_NAME}"] kill`,
			`event entity @e[type=f:t,name="${WB_CONFIG.DRAW_SELECTION2_NAME}"] kill`,
		].forEach((e) => XA.runCommandX(e));
		const ent1 = XA.Entity.getEntityAtPos(this.pos1.x, this.pos1.y, this.pos1.z);
		const ent2 = XA.Entity.getEntityAtPos(this.pos2.x, this.pos2.y, this.pos2.z);
		if (ent1.length == 0) {
			XA.runCommandX(`event entity @e[type=f:t,name="${WB_CONFIG.DRAW_SELECTION1_NAME}"] kill`);
			XA.runCommandX(
				`summon f:t ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} spawn "${WB_CONFIG.DRAW_SELECTION1_NAME}"`
			);
		}
		if (ent2.length == 0) {
			XA.runCommandX(`event entity @e[type=f:t,name="${WB_CONFIG.DRAW_SELECTION2_NAME}"] kill`);
			XA.runCommandX(
				`summon f:t ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} spawn "${WB_CONFIG.DRAW_SELECTION2_NAME}"`
			);
		}
		for (let ent of ent1) {
			if (ent.id == "f:t" && ent.nameTag == WB_CONFIG.DRAW_SELECTION1_NAME) break;
			XA.runCommandX(`event entity @e[type=f:t,name="${WB_CONFIG.DRAW_SELECTION1_NAME}"] kill`);
			XA.runCommandX(
				`summon f:t ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} spawn "${WB_CONFIG.DRAW_SELECTION1_NAME}"`
			);
			break;
		}
		for (let ent of ent2) {
			if (ent.id == "f:t" && ent.nameTag == WB_CONFIG.DRAW_SELECTION2_NAME) break;
			XA.runCommandX(`event entity @e[type=f:t,name="${WB_CONFIG.DRAW_SELECTION2_NAME}"] kill`);
			XA.runCommandX(
				`summon f:t ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} spawn "${WB_CONFIG.DRAW_SELECTION2_NAME}"`
			);
			break;
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
		const structure = new Structure(WB_CONFIG.BACKUP_PREFIX, pos1, pos2);
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
			if (this.history.length < amount) amount = this.history.length;
			const backups = this.history.slice(-amount);
			for (const backup of backups.reverse()) {
				this.backup(backup.pos1, backup.pos2, this.undos);
				backup.load();
				this.history.splice(this.history.indexOf(backup), 1);
			}

			const e = XA.Cooldown.getT(amount.toString(), ["бэкап", "бэкапа", "бэкапов"]);
			return `§b► §3Успешно отменен${amount.toString().endsWith("1") ? "" : "о"} §f${amount} §3${e}!`;
		} catch (error) {
			return `§4► ${error}`;
		}
	}
	/**
	 * Redoes the latest history save
	 * @returns {string}
	 * @example redo();
	 */
	redo(amount = 1) {
		try {
			if (this.undos.length < amount) amount = this.undos.length;
			const backups = this.undos.slice(-amount);
			for (const backup of backups.reverse()) {
				this.backup(backup.pos1, backup.pos2, this.undos);
				backup.load();
				this.undos.splice(this.undos.indexOf(backup), 1);
			}

			const e = XA.Cooldown.getT(amount.toString(), ["бэкап", "бэкапа", "бэкапов"]);
			return `§b► §3Успешно возвращен${amount.toString().endsWith("1") ? "" : "о"} §f${amount} §3${e}!`;
		} catch (error) {
			return `§4► ${error}`;
		}
	}
	/**
	 * Copys The curret positions
	 * @returns {Promise<string>}
	 * @example copy();
	 */
	async copy() {
		try {
			const opt = await XA.runCommandX(
				`structure save ${WB_CONFIG.COPY_FILE_NAME} ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} false memory`
			);
			if (!opt) throw new Error(opt + "");
			this.current_copy = {
				pos1: this.pos1,
				pos2: this.pos2,
				name: WB_CONFIG.COPY_FILE_NAME,
			};
			return `§9► §rСкопированно из ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} to ${this.pos2.x} ${this.pos2.y} ${this.pos2.z}`;
		} catch (error) {
			return `§4► Не удалось скорпировать [${error}]`;
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
	async paste(
		player,
		rotation = 0,
		mirror = "none",
		includesEntites = false,
		includesBlocks = true,
		integrity = 100.0,
		seed = ""
	) {
		try {
			const dx = Math.abs(this.current_copy.pos2.x - this.current_copy.pos1.x);
			const dy = Math.abs(this.current_copy.pos2.y - this.current_copy.pos1.y);
			const dz = Math.abs(this.current_copy.pos2.z - this.current_copy.pos1.z);
			const pos2 = new BlockLocation(player.location.x, player.location.y, player.location.z).offset(dx, dy, dz);

			const loc = XA.Entity.vecToBlockLocation(player.location);

			this.backup(loc, pos2);

			await player.runCommandAsync(
				`structure load ${WB_CONFIG.COPY_FILE_NAME} ~ ~ ~ ${String(rotation).replace(
					"NaN",
					"0"
				)}_degrees ${mirror} ${includesEntites} ${includesBlocks} ${integrity ? integrity : ""} ${seed ? seed : ""}`
			);

			return `§a► §rВставлено в ${loc.x} ${loc.y} ${loc.z}`;
		} catch (error) {
			ThrowError(error);
			return `§4Не удалось вставить`;
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

		if (!isNaN(data)) add(data);

		if (replaceMode) {
			add(replaceMode);
			if (replaceMode === "replace") {
				if (replaceBlock) add(replaceBlock);
				if (!isNaN(rbData)) add(rbData);
			}
		}

		for (const cube of Cube.split(WB_CONFIG.FILL_CHUNK_SIZE)) {
			const result = await XA.runCommandX(
				`fill ${cube.pos1.x} ${cube.pos1.y} ${cube.pos1.z} ${cube.pos2.x} ${cube.pos2.y} ${cube.pos2.z} ${fulldata}`,
				{ showError: true, showOutput: true }
			);
			if (result === 0) errors++;
			all++;
			await sleep(1);
		}

		const endTime = get(Date.now() - startTime);

		let reply = `§3Заполненно §f${blocks} §3блоков ${
			endTime.parsedTime !== "0" ? `за §f${endTime.parsedTime} §3${endTime.type}.` : ""
		}`;
		if (replaceMode) reply += ` §3Режим заполнения: §b${replaceMode}`;
		if (replaceMode === "replace") reply += `§3, заполняемый блок: §f${replaceBlock} ${rbData ? rbData : ""}`;

		if (errors) return `§4► §7[§c${errors}§7|§f${all}§7] §cОшибок. ${reply}`;
		return `§b► ${reply}`;
	}
	getPoses() {
		return {
			p1: this.pos1,
			p2: this.pos2,
			bp1: new BlockLocation(this.pos1.x, this.pos1.y, this.pos1.z),
			bp2: new BlockLocation(this.pos2.x, this.pos2.y, this.pos2.z),
		};
	}
}
export const WorldEditBuild = new WorldEditBuilder();

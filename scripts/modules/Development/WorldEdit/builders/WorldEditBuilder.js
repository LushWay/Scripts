import {
	MolangVariableMap,
	Player,
	Vector,
	system,
	world,
} from "@minecraft/server";
import { Cooldown, util } from "xapi.js";
import { CONFIG_WE } from "../config.js";
import { Cuboid } from "../utils/Cuboid.js";
import { get } from "../utils/utils.js";
import { Structure } from "./StructureBuilder.js";

class WorldEditBuilder {
	drawselection = CONFIG_WE.DRAW_SELECTION_DEFAULT;
	/** @type {Vector3} */
	#pos1 = null;
	/** @type {Vector3} */
	#pos2 = null;
	/**
	 * @type {Cuboid}
	 */
	selectionCuboid;
	get pos1() {
		return this.#pos1;
	}
	set pos1(val) {
		this.#pos1 = val;
		if (this.#pos2) this.selectionCuboid = new Cuboid(val, this.#pos2);
	}
	get pos2() {
		return this.#pos2;
	}
	set pos2(val) {
		this.#pos2 = val;
		if (this.#pos1) this.selectionCuboid = new Cuboid(this.#pos1, val);
	}

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
	currentCopy = {
		pos1: null,
		pos2: null,
		name: "",
	};

	constructor() {}

	drawSelection() {
		if (!this.drawselection || !this.selectionCuboid) return;
		const selectedSize = Vector.size(
			this.selectionCuboid.min,
			this.selectionCuboid.max
		);
		if (selectedSize > CONFIG_WE.DRAW_SELECTION_MAX_SIZE) return;
		const { xMax, xMin, zMax, zMin, yMax, yMin } = this.selectionCuboid;
		const gen = Vector.foreach(
			this.selectionCuboid.min,
			this.selectionCuboid.max
		);
		let step;
		while (!step?.done) {
			step = gen.next();
			if (!step.value) continue;
			const { x, y, z } = step.value;
			const q =
				((x == xMin || x == xMax) && (y == yMin || y == yMax)) ||
				((y == yMin || y == yMax) && (z == zMin || z == zMax)) ||
				((z == zMin || z == zMax) && (x == xMin || x == xMax));

			if (q)
				world.overworld.spawnParticle(
					CONFIG_WE.DRAW_SELECTION_PARTICLE,
					{ x: x + 0.5, y: y + 0.5, z: z + 0.5 },
					new MolangVariableMap()
				);
		}
	}
	/**
	 * Backups a location
	 * @param {Vector3} pos1 Position 1 of cuboid location
	 * @param {Vector3} pos2 Position 2 of cuboid location
	 * @param {Structure[]} saveLocation Save location where you want the data to store your backup
	 * @example backup(pos1, pos2, history);
	 */
	async backup(
		pos1 = this.pos1,
		pos2 = this.pos2,
		saveLocation = this.history
	) {
		const structure = new Structure(CONFIG_WE.BACKUP_PREFIX, pos1, pos2);
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

			const e = Cooldown.getT(amount.toString(), [
				"бэкап",
				"бэкапа",
				"бэкапов",
			]);
			return `§b► §3Успешно отменен${
				amount.toString().endsWith("1") ? "" : "о"
			} §f${amount} §3${e}!`;
		} catch (error) {
			util.error(error);
			return `§4► §cНе удалось отменить: ${error.message}`;
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

			const e = Cooldown.getT(amount.toString(), [
				"бэкап",
				"бэкапа",
				"бэкапов",
			]);
			return `§b► §3Успешно возвращен${
				amount.toString().endsWith("1") ? "" : "о"
			} §f${amount} §3${e}!`;
		} catch (error) {
			util.error(error);
			return `§4► §cНе удалось вернуть: ${error.message}`;
		}
	}
	/**
	 * Copys The curret positions
	 * @returns {string}
	 */
	copy() {
		try {
			if (!this.selectionCuboid)
				return "§4► §cЗона для копирования не выделена!";

			const result = world.overworld.runCommand(
				`structure save ${CONFIG_WE.COPY_FILE_NAME} ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} false memory`
			);
			if (!result)
				return `§4► §cНе удалось скопировать, вызов команды возвратил ошибку.`;

			this.currentCopy = {
				pos1: this.pos1,
				pos2: this.pos2,
				name: CONFIG_WE.COPY_FILE_NAME,
			};
			return `§9► §fСкопированно из ${Vector.string(
				this.pos1
			)} в ${Vector.string(this.pos2)}`;
		} catch (error) {
			util.error(error);
			return `§4► §cНе удалось скорпировать: ${error.message}`;
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
	 * @returns {string}
	 * @example paste(Player, 0, "none", false, true, 100.0, "");
	 */
	paste(
		player,
		rotation = 0,
		mirror = "none",
		includesEntites = false,
		includesBlocks = true,
		integrity = 100.0,
		seed = ""
	) {
		try {
			const dx = Math.abs(this.currentCopy.pos2.x - this.currentCopy.pos1.x);
			const dy = Math.abs(this.currentCopy.pos2.y - this.currentCopy.pos1.y);
			const dz = Math.abs(this.currentCopy.pos2.z - this.currentCopy.pos1.z);
			const pos2 = Vector.add(player.location, new Vector(dx, dy, dz));

			const loc = Vector.floor(player.location);

			this.backup(loc, pos2);

			player.runCommand(
				`structure load ${CONFIG_WE.COPY_FILE_NAME} ~ ~ ~ ${String(
					rotation
				).replace(
					"NaN",
					"0"
				)}_degrees ${mirror} ${includesEntites} ${includesBlocks} ${
					integrity ? integrity : ""
				} ${seed ? seed : ""}`
			);

			return `§a► §rВставлено в ${loc.x} ${loc.y} ${loc.z}`;
		} catch (error) {
			util.error(error);
			return `§4► §cНе удалось вставить: ${error.message}`;
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

		for (const cube of Cube.split(CONFIG_WE.FILL_CHUNK_SIZE)) {
			const result = world.overworld.runCommand(
				`fill ${cube.pos1.x} ${cube.pos1.y} ${cube.pos1.z} ${cube.pos2.x} ${cube.pos2.y} ${cube.pos2.z} ${fulldata}`,
				{ showError: true, showOutput: false }
			);
			if (result === 0) errors++;
			all++;
			await system.sleep(1);
		}

		const endTime = get(Date.now() - startTime);

		let reply = `§3Заполненно §f${blocks} §3блоков`;
		if (endTime.parsedTime !== "0") {
			reply += ` за §f${endTime.parsedTime} §3${endTime.type}.`;
		}
		if (replaceMode) {
			reply += ` §3Режим заполнения: §b${replaceMode}`;
		}
		if (replaceMode === "replace") {
			reply += `§3, заполняемый блок: §f${replaceBlock} ${
				rbData ? rbData : ""
			}`;
		}
		if (errors)
			return `§4► §7[§c${errors}§7|§f${all}§7] §cОшибок при заполнении. ${reply}`;
		return `§b► ${reply}`;
	}
}
export const WorldEditBuild = new WorldEditBuilder();

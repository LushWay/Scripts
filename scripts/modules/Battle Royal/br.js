import { BlockLocation, Player, world } from "@minecraft/server";
import { sleep, XA } from "xapi.js";
import { Subscriber } from "../../lib/Class/XEvents.js";
import { rd } from "../Airdrops/index.js";
import { Atp } from "../Server/portals.js";
import { rtp } from "./rtp.js";
import { BR_CONFIG } from "./var.js";
import { zone } from "./zone.js";

/** @type {Subscriber<Player>} */
const playerJoinQuene = new Subscriber();

/** @type {Subscriber<Player>} */
const playerDeath = new Subscriber();

export const BATTLE_ROYAL_EVENTS = {
	playerJoin: playerJoinQuene.export,
	death: playerDeath.export,
};

class BattleRoyal {
	constructor() {
		/**
		 * @type {Array<Player>}
		 */
		this.players = [];
		this.reward = 0;
		this.pos = { x: 256, z: 256 };
		this.time = {
			min: 0,
			sec: 0,
			tick: 20,
		};
		this.game = {
			started: false,
			rad: 0,
			startrad: 0,
			minrad: 0,
		};
		this.center = {
			x: 0,
			z: 0,
		};
		this.quene = {
			open: false,
			time: 0,
		};
		this.events = {};
		this.tags = ["lockpvp:Battle royal", "locktp:Battle royal", "br:alive", "br:inGame"];
	}
	/**
	 * Waiting for the player to respawn.
	 * @param {string} name Name of the player
	 */
	async waitToRespawn(name) {
		let C = 0;

		while ((await XA.runCommandX("testfor " + name)) < 1 && C < 100) {
			await sleep(5);
			C++;
		}
		playerJoinQuene.emit(XA.Entity.fetch(name));
	}

	/**
	 *
	 * @param {string[]} players
	 * @returns
	 */
	start(players) {
		try {
			// Ресет
			this.quene.open = false;
			this.quene.time = 0;

			// Варн
			if (!BR_CONFIG.pos || !BR_CONFIG.gamepos)
				return this.end("error", "§cТребуемые для запуска значения (br:pos, br:gamepos) не выставлены.");

			// Значения из настроек
			[this.time.min, this.time.sec] = BR_CONFIG.time.split(":").map(Number);
			[this.pos.x, this.pos.z] = BR_CONFIG.gamepos.split(":").map(Number);
			this.game.started = true;
			this.reward = 0;

			const allplayers = world.getAllPlayers().map((e) => e.id);
			players = players.filter((e) => allplayers.includes(e));

			if (players.length < 1) return this.end("error", "§cЗапуск без игроков невозможен");

			this.reward = this.reward + players.length * 100;
			this.game.rad = Math.min(60 * players.length, 128);
			this.game.minrad = Math.min(15 * players.length, 40);
			this.game.startrad = this.game.rad;

			// Центр
			this.center.z = rd(this.pos.z + 128 + 50, this.pos.z + 128 - 50, "centerZ");
			this.center.x = rd(this.pos.x + 128 + 50, this.pos.x + 128 - 50, "centerX");

			/** Сундуки (для удаления в будущем)
			 * @type {Array<string>}
			 */
			let chest = [];
			let poses = [];
			let debug = false;
			if (debug) {
				world.say(
					`Pos1: ${this.pos.x} ${this.pos.z}\nCenter: ${this.center.x} ${this.center.z}\nPos2: ${this.pos.x + 256} ${
						this.pos.z + 256
					}`
				);
			}

			// Для каждого игрока
			for (const e of players) {
				// Тэги
				const p = XA.Entity.fetch(e);
				this.tags.forEach((e) => p.addTag(e));

				// Список
				this.players.push(p);

				// Инфо
				p.tell(XA.Lang.lang["br.start"](this.reward, allplayers.join("§r, "), this.game.rad));

				// Очистка, звук
				p.runCommandAsync("clear @s");
				p.playSound("note.pling");

				// Ртп
				const pos = rtp(p, this.center.x, this.center.z, this.game.rad - 15, this.game.rad - 30, poses);
				poses.push(pos);
				XA.runCommandX(`kill @e[x=${pos.x},z=${pos.z},y=${pos.y},r=100,type=item]`);

				//Стартовый сундук
				// const ps = new LootChest(pos.x, pos.z, 0, 10).pos;
				// if (ps) chest.push(ps);
			}

			XA.tables.chests.set("br:" + Date.now(), JSON.stringify(chest));
			this.events = {
				tick: world.events.tick.subscribe(() => {
					//Таймер
					this.time.tick--;
					if (this.time.tick <= 0) {
						this.time.sec--, (this.time.tick = 20);
						for (const val of XA.tables.chests.values()) {
							let p = [];
							try {
								p = JSON.parse(val);
							} catch (e) {}
							for (const pos of p) {
								XA.runCommandX(`particle minecraft:campfire_smoke_particle ${pos}`);
							}
						}
					}
					if (this.time.sec <= 0) this.time.min--, (this.time.sec = 59);

					//Зона
					for (const p of world.getPlayers()) {
						const rmax = new BlockLocation(this.center.x + this.game.rad, 0, this.center.z + this.game.rad),
							rmin = new BlockLocation(this.center.x - this.game.rad, 0, this.center.z - this.game.rad);
						const l = XA.Utils.vecToBlockLocation(p.location);
						if (l.x >= rmax.x && l.x <= rmax.x + 10 && l.z <= rmax.z && l.z >= rmin.z) zone.ret(p, true, rmax);
						if (l.x >= rmax.x - 10 && l.x <= rmax.x && l.z <= rmax.z && l.z >= rmin.z) zone.pret(p, true, rmax);

						if (l.z >= rmax.z && l.z <= rmax.z + 10 && l.x <= rmax.x && l.x >= rmin.x) zone.ret(p, false, rmax);
						if (l.z >= rmax.z - 10 && l.z <= rmax.z && l.x <= rmax.x && l.x >= rmin.x) zone.pret(p, false, rmax);

						if (l.x <= rmin.x && l.x >= rmin.x - 10 && l.z <= rmax.z && l.z >= rmin.z) zone.ret(p, true, rmin, true);
						if (l.x <= rmin.x + 10 && l.x >= rmin.x && l.z <= rmax.z && l.z >= rmin.z) zone.pret(p, true, rmin);

						if (l.z <= rmin.z && l.z >= rmin.z - 10 && l.x <= rmax.x && l.x >= rmin.x) zone.ret(p, false, rmin, true);
						if (l.z <= rmin.z + 10 && l.z >= rmin.z && l.x <= rmax.x && l.x >= rmin.x) zone.pret(p, false, rmin);
					}

					//Отображение таймера и игроков
					XA.runCommandX(
						`title @a[tag="br:inGame"] actionbar §6${this.players.filter((e) => e.hasTag("br:alive")).length} §g○ §6${
							this.time.min
						}:${`${this.time.sec}`.length < 2 ? `0${this.time.sec}` : this.time.sec} §g○ §6${this.game.rad}`
					);

					//Конец игры
					if (this.time.min <= -1) this.end("time");
					if (this.players.filter((e) => e.hasTag("br:alive")).length <= 1)
						this.end(
							"last",
							this.players.find((e) => e && e.hasTag("br:alive"))
						);
				}),
				playerLeave: world.events.playerLeave.subscribe((pl) => {
					if (this.players.find((e) => e.name == pl.playerName)) delete this.players[pl.playerName];
				}),
				beforeDataDrivenEntityTriggerEvent: world.events.beforeDataDrivenEntityTriggerEvent.subscribe((data) => {
					if (data.id != "binocraft:on_death" || !data.entity.hasTag("br:alive")) return;

					this.tags.forEach((e) => data.entity.removeTag(e));
					this.waitToRespawn(data.entity.nameTag);
				}),
				buttonPush: world.events.buttonPush.subscribe((data) => {
					if (!data.source.hasTag("br:alive") || !(data.source instanceof Player)) return;
					const block = data.dimension.getBlock(data.block.location.offset(0, -1, 0));
					if (block.typeId !== "minecraft:barrel") return;
					const id = `${block.location.x} ${block.location.y} ${block.location.z}`;
					if (XA.tables.chests.get(id)) return;
					XA.tables.chests.set(id, "true");
					// Loot
					data.source.onScreenDisplay.setTitle("§r");
					data.source.onScreenDisplay.updateSubtitle("Открыто");
				}),
			};
		} catch (e) {
			this.end("error", e);
		}
	}

	/**
	 *
	 * @param {string} reason
	 * @param {*} ex
	 */
	end(reason, ex) {
		this.game.started = false;
		//Причины и соответствующие выводы
		if (reason === "time") {
			this.players.forEach((e) => {
				e.tell(
					XA.Lang.lang["br.end.time"](
						this.players
							.filter((e) => e.hasTag("br:alive"))
							.map((e) => e.name)
							.join("§r, ")
					)
				);
			});
		}
		if (reason === "error") {
			world.say(`§cБатл рояль> §c\n${ex} ${ex.stack ? "" : `\n§f${ex.stack}`}`);
		}
		if (reason === "specially") {
			world.say(XA.Lang.lang["br.end.spec"](ex));
		}
		if (reason === "last") {
			/**
			 * @type {Player}
			 */
			const winner = ex;
			if (typeof winner == "object" && XA.Entity.fetch(winner.name)) {
				winner.tell(XA.Lang.lang["br.end.winner"](this.reward));
				XA.runCommandX(`title "${winner.name}" title §6Ты победил!`);
				XA.runCommandX(`title "${winner.name}" subtitle §gНаграда: §f${this.reward} §gмонет`);
				this.players
					.filter((e) => e.name != winner.name)
					.forEach((e) => {
						e.tell(XA.Lang.lang["br.end.looser"](winner.name, this.reward));
					});
			} else {
				this.players.forEach((e) => {
					e.tell(XA.Lang.lang["br.end.draw"]());
				});
			}
		}

		//Общие функции конца

		for (const e of world.getPlayers()) {
			// Eсли у игрока был хоть один тэг из батл рояля - он играл.

			let ingame = false;
			this.tags.forEach((t) => {
				if (e.removeTag(t)) ingame = true;
			});
			// Если играл нужно его вернуть на спавн батл рояля
			if (ingame) Atp(e, "br", { lock: true, pvp: true, quene: true });
		}
		for (const key of Object.keys(this.events)) {
			world.events[key].unsubscribe(this.events[key]);
		}

		//Альтернативная чепуха
		XA.tables.chests.clear();

		const rmax = new BlockLocation(this.center.x + this.game.startrad, 0, this.center.z + this.game.startrad);
		const rmin = new BlockLocation(this.center.x - this.game.startrad, 0, this.center.z - this.game.startrad);
		for (const p of XA.dimensions.overworld.getEntities({ type: "minecraft:item" })) {
			const l = XA.Utils.vecToBlockLocation(p.location);
			if (l.z <= rmin.z && l.x <= rmin.x && l.x <= rmax.x && l.x >= rmin.x) p.kill();
		}
		Object.assign(this, new BattleRoyal());
	}
}

export const br = new BattleRoyal();

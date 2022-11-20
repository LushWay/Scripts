import {
	BlockLocation,
	BlockRaycastOptions,
	EnchantmentList,
	Items,
	ItemStack,
	Location,
	MinecraftEnchantmentTypes,
	MolangVariableMap,
	Player,
	world,
} from "@minecraft/server";

import { po, ScoreboardDB, wo } from "../../lib/Class/Options.js";

import { setTickInterval, toStr, XA } from "xapi.js";

/**======================
 **       PLUGINS
 *========================**/
import "./commands/id.js";
import "./commands/lore.js";
import "./commands/other.js";
import "./commands/particle.js";
import "./commands/role.js";
import "./commands/sound.js";
import "./commands/world.js";
import "./options.js";
import { Atp } from "./portals.js";
import { stats } from "./stats.js";
import "./tool.js";
/*------------------------------------------ КОНЕЦ ИМПОРТОВ ------------------------------------------*/

/**
 *
 * @param {Player} pl
 * @param {boolean} isX
 * @param {{x: number, z: number}} zone
 * @param {boolean} [plus]
 */
function ret(pl, isX, zone, plus) {
	const a = isX
		? `${plus ? zone.x + 1 : zone.x - 1} ${pl.location.y} ${pl.location.z}`
		: `${pl.location.x} ${pl.location.y} ${plus ? zone.z + 1 : zone.z - 1}`;
	XA.Chat.rcs([
		`tp "${pl.name}" ${a}`,
		`title "${pl.name}" actionbar §cОграничение мира до: §f${
			isX ? zone.x : zone.z
		}${isX ? "x" : "z"}`,
	]);
}
/**
 *
 * @param {Player} pl
 * @param {boolean} isX
 * @param {{x: number, z: number}} zone
 */
function pret(pl, isX, zone) {
	const a = isX
		? `${zone.x} ${Math.floor(pl.location.y) + 1} ${Math.floor(pl.location.z)}`
		: `${Math.floor(pl.location.x)} ${Math.floor(pl.location.y) + 1} ${zone.z}`;
	XA.Chat.rcs([
		`particle minecraft:falling_border_dust_particle ${a}`,
		`particle minecraft:rising_border_dust_particle ${a}`,
	]);
}
/**
 *
 *
 *
 *
 *
 *
 */

/**============================================
 **               Таймеры
 *=============================================**/
export const Allhrs = new ScoreboardDB("Allhrs", "Часов в игре");
export const Allmin = new ScoreboardDB("Allmin", "Минут в игре");
export const Allsec = new ScoreboardDB("Allsec", "Секунд в игре");
export const Dayhrs = new ScoreboardDB("Dayhrs", "Часов за день");
export const Daymin = new ScoreboardDB("Daymin", "Минут за день");
export const Daysec = new ScoreboardDB("Daysec", "Секунд за день");
export const Seahrs = new ScoreboardDB("Seahrs", "Часов анархия");
export const Seamin = new ScoreboardDB("Seamin", "Минут анархия");
export const Seasec = new ScoreboardDB("Seasec", "Секунд анархия");
/*=============== END OF SECTION ==============*/

/*=== Глобальный радиус ===*/
export var globalRadius = 200;
/*==== END OF SECTION ====*/

/**============================================
 **               Query объекты
 *=============================================**/
/**
 * @type {import("@minecraft/server").EntityQueryOptions}
 */
const qq = { type: "fireworks_rocket" };

/**
 * @type {import("@minecraft/server").ExplosionOptions}
 */
const boom = {
	breaksBlocks: false,
	causesFire: true,
};
/*=============== END OF SECTION ==============*/

/*
 *
 *
 *
 *
 *
 *
 */

//*Немного скорбордов
XA.Chat.runCommand("scoreboard players reset * perm");
XA.Chat.runCommand("scoreboard objectives add join dummy");

const arraspdk = ["^^^1", "^^^2", "~~~", "~~-1~", "~~1~"]; //

// for (let x = -1; x <= 1; x++) {
//   for (let y = -1; y <= 1; y++) {
//     for (let z = -1; z <= 1; z++) {
//       if (x+y+z == x*3) continue
//       arraspdk.push(`~${x!=0?x:''}~${y!=0?y:''}~${z!=0?z:''}`)
//     }
//   }
// }
// world.say(arraspdk.join(', '))

/**
 *
 * @param {BlockLocation} center
 * @param {BlockLocation} pos
 * @param {number} r
 * @returns
 */
const isInRad = (center, pos, r) => {
	const cx = center.x,
		cy = center.y,
		cz = center.z;
	const { x, y, z } = pos;
	return (
		x <= r + cx &&
		y <= r + cy &&
		z <= r + cz &&
		x <= r - cx &&
		y <= r - cy &&
		z <= r - cz
	);
};

function check(f) {
	try {
		arraspdk.forEach((e) => f.runCommand(`testforblock ${e} air`));
		return true;
	} catch (e) {
		return false;
	}
}

/*=========================================== ВЗРЫВНЫЕ ФЕЙРВЕРКИ ===========================================*/
setTickInterval(() => {
	for (const f of XA.o.getEntities(qq)) {
		if (
			isInRad(
				//@ts-ignore
				ocation(...wo.Q("spawn:pos").split(" ")),
				XA.Entity.locationToBlockLocation(f.location),
				200
			)
		)
			continue;
		if (
			isInRad(
				//@ts-ignore
				new BlockLocation(...wo.Q("minigames:pos").split(" ")),
				XA.Entity.locationToBlockLocation(f.location),
				50
			)
		)
			continue;
		if (!XA.Entity.getTagStartsWith(f, "l:")) {
			const sender = XA.Entity.getClosetsEntitys(
				f,
				2,
				"minecraft:player",
				1,
				false
			)[0];
			if (sender instanceof Player) {
				const lore = XA.Entity.getHeldItem(sender).getLore()[0];
				if (!lore || lore == "§r§н") continue;
				if (lore == "§r§б") f.addTag("блоки");
				if (lore == "§r§и") f.addTag("игроки");
				stats.FVlaunc.Eadd(sender, 1);
				f.addTag("l:" + sender.name);
			}
		}
		// const id = f.dimension.getBlock(
		//     XA.Entity.locationToBlockLocationn(f.location)
		//   ).id,
		//   id2 = f.dimension.getBlock(
		//     XA.Entity.locationToBlockLocationn(
		//       new Location(
		//         f.location.x,
		//         Math.round(f.location.y + 0.8),
		//         f.location.z
		//       )
		//     )
		//   ).id,
		//   id3 = f.dimension.getBlock(
		//     XA.Entity.locationToBlockLocationn(
		//       new Location(
		//         f.location.x,
		//         Math.round(f.location.y - 0.8),
		//         f.location.z
		//       )
		//     )
		//   ).id;
		// if (
		//   id == "minecraft:air" &&
		//   id2 == "minecraft:air" &&
		//   id3 == "minecraft:air"
		// )
		//   continue;
		const type = f.hasTag("блоки") ? 2 : f.hasTag("игроки") ? 3 : 0;
		//console.warn(type);
		if (type == 0) continue;
		if (type == 2) {
			if (check(f)) {
				continue;
			} else boom.breaksBlocks = true;
		}

		if (type == 3)
			try {
				f.runCommand("testforblock ^^^1 air");
				f.runCommand("testforblock ^^^2 air");
				continue;
			} catch (e) {}
		let a = [...world.getPlayers()].find(
			(e) => e.name == XA.Entity.getTagStartsWith(f, "l:")
		);
		// world.say(a.name);
		if (a) stats.FVboom.Eadd(a, 1);
		f.dimension.createExplosion(f.location, type, boom);
		f.kill();
		boom.breaksBlocks = false;
	}
}, 0);

setTickInterval(() => {
	/*================================================================================================*/

	/*=========================================== ЗОНА ===========================================*/
	const players = [...world.getPlayers()];
	globalRadius = 200 + 20 * players.length;
	const rad = globalRadius;
	const pcenter = wo.G("zone:center");
	const center = pcenter ? pcenter.split(", ").map(Number) : [0, 0];

	/**
	 *
	 * @param {number} value
	 * @param {number} min
	 * @param {number} max
	 * @returns
	 */
	const inRange = (value, min, max) => value <= max && value >= min;

	for (const p of players) {
		const rmax = { x: center[0] + rad, z: center[1] + rad };
		const rmin = { x: center[0] - rad, z: center[1] - rad };
		const l = XA.Entity.locationToBlockLocation(p.location);

		const xtrue = inRange(l.x, rmin.x, rmax.x);
		const ztrue = inRange(l.z, rmin.z, rmax.z);

		if (xtrue && ztrue) {
			if (
				XA.Entity.getScore(p, "inv") !== 2 &&
				!p.hasTag("saving") &&
				!p.hasTag("br:ded")
			) {
				Atp(p, "anarch", { pvp: true });
			}
		}

		if (l.x >= rmax.x && l.x <= rmax.x + 10 && ztrue) ret(p, true, rmax);
		if (l.x >= rmax.x - 10 && l.x <= rmax.x && ztrue) pret(p, true, rmax);

		if (l.z >= rmax.z && l.z <= rmax.z + 10 && xtrue) ret(p, false, rmax);
		if (l.z >= rmax.z - 10 && l.z <= rmax.z && xtrue) pret(p, false, rmax);

		if (l.x <= rmin.x && l.x >= rmin.x - 10 && ztrue) ret(p, true, rmin, true);
		if (l.x <= rmin.x + 10 && l.x >= rmin.x && ztrue) pret(p, true, rmin);

		if (l.z <= rmin.z && l.z >= rmin.z - 10 && xtrue) ret(p, false, rmin, true);
		if (l.z <= rmin.z + 10 && l.z >= rmin.z && xtrue) pret(p, false, rmin);
	}

	XA.Chat.rcs([
		`scoreboard objectives add lockedtitle dummy`,
		`scoreboard players add @a lockedtitle 0`,
	]);
	for (const pl of world.getPlayers({ excludeTags: ["br:inGame"] }))
		if (
			pl.dimension.getBlock(
				XA.Entity.locationToBlockLocation(pl.location).offset(
					0,
					-64 - pl.location.y,
					0
				)
			)?.typeId === "minecraft:deny"
		)
			pl.triggerEvent("spawn");

	for (const ent of XA.o.getEntities({ families: ["monster"] }))
		if (
			ent.dimension.getBlock(
				XA.Entity.locationToBlockLocation(ent.location).offset(
					0,
					-64 - ent.location.y,
					0
				)
			).typeId === "minecraft:deny"
		)
			XA.Entity.despawn(ent);
}, 0);

/*
|--------------------------------------------------------------------------
* * Каждые 10 тиков
|--------------------------------------------------------------------------
| 
| Фильтр инвентаря, Пвп мод, При входе, Блокировка незера и Разрешения
| 
*/
setTickInterval(async () => {
	let players = [];
	for (const player of world.getPlayers()) {
		players.push(player.name);

		//*Фильтр предметов в инвентаре для Chest Gui
		const inv = XA.Entity.getI(player);
		for (let i = 0; i < inv.size; i++) {
			const item = inv.getItem(i);
			const lore = item?.getLore();
			let lastInd, lastLore;
			if (lore) (lastInd = lore.length - 1), (lastLore = lore[lastInd]);
			if (
				item &&
				(item?.nameTag?.startsWith("§r§m§n§m") ||
					item?.nameTag?.startsWith("§m§n§m") ||
					(lastLore && lastLore?.endsWith("§{§-§}")))
			) {
				const item2 = new ItemStack(
					Items.get(item.typeId),
					item.amount,
					item.data
				);
				inv.setItem(i, item2);
			}
			if (item && item.typeId == "minecraft:crossbow") {
				/**
				 * @type {EnchantmentList}
				 */
				let ench = item.getComponent("enchantments").enchantments,
					o = false;
				const mm = ench.getEnchantment(MinecraftEnchantmentTypes.multishot),
					m = ench.getEnchantment(MinecraftEnchantmentTypes.piercing);
				if (m)
					item.setLore(["§r§б", "§r§fЦель ракет: §6блоки"]),
						(o = true),
						(item.nameTag = "§r§fРазрывная");
				if (mm)
					item.setLore(["§r§и", "§r§fЦель ракет: §6игроки"]),
						(o = true),
						(item.nameTag = "§r§fПодрыв жоп");
				if (!o)
					item.setLore([
						"§r§н",
						"§r§fБронебойность: §6блоки",
						"§r§fТройной выстрел: §6игроки",
					]);
				inv.setItem(i, item);
			}
		}

		/*================================ PVP MODE ==============================*/
		if (
			wo.Q("server:pvpmode:enable") &&
			po.Q("title:pvpmode", player) &&
			!XA.Entity.getTagStartsWith(player, "lockpvp:") &&
			XA.Entity.getScore(player, "pvp") > 0
		) {
			const score = XA.Entity.getScore(player, "pvp");
			const max = wo.Q("server:pvpmode:cooldown") ?? 15;
			const q = (p) => (score == max ? `§4${p}` : "");
			if (XA.Entity.getScore(player, "lockedtitle") <= 0) {
				player.onScreenDisplay.setActionBar(
					`${q("»")} §6PvP: ${score} ${q("«")}`
				);
			}
		}
		/*========================================================================*/

		/*================================ ON JOIN ==============================*/

		/*========================================================================*/

		/*================== Блокировка незера =================*/
		if (wo.Q("lock:nether")) {
			try {
				player.runCommand(`testforblock ~~~ portal`);
				player.runCommand(
					`tellraw @a {"rawtext":[{"text":"§c► §f${player.name}§c Измерение ''Незер'' заблокированно."}]}`
				);
				player.runCommand(`fill ~-2~-2~-2 ~2~2~2 air 0 replace portal`);
			} catch (e) {}
		}
	}
	/*================================ DEBUG2 ==============================*/
	if (wo.Q("debug:menu")) {
		for (const ent of XA.o.getEntities({ type: "mcbehub:inventory" })) {
			ent.runCommand("particle minecraft:endrod ~~~");
		}
	}
}, 10);

/*
|--------------------------------------------------------------------------
* * Каждую секунду
|--------------------------------------------------------------------------
|
| -sit, -base, TOOL, PVP -sec, Другие таймеры
| 
*/
setTickInterval(() => {
	/*================== -sit доработка =================*/
	for (const e of XA.Entity.getEntitys()) {
		if (e.typeId !== "s:it") continue;
		const pl = XA.Entity.getClosetsEntitys(e, 1, "minecraft:player", 1, false);
		if (pl.length < 1) e.triggerEvent("kill");
	}
	/*===================================================*/

	/*================== -base доработка =================*/

	/*===================================================*/
	for (const p of world.getPlayers()) {
		let q = true;
		//* Переключение инвентаря
		if (q)
			try {
				p.runCommand(
					`execute positioned ${wo.Q("spawn:pos")} run testfor @p[name="${
						p.name
					}",scores={inv=!1},r=200,tag=!"br:ded"]`
				);
				q = false;
				Atp(p, "spawn", { pvp: true });
				new XA.instantDB(world, "pos").delete(p.id);
			} catch (e) {}
		if (q)
			try {
				p.runCommand(
					`execute positioned ${wo.Q("minigames:pos")} run testfor @p[name="${
						p.name
					}",scores={inv=!1},r=200,tag=!"br:ded"]`
				);
				q = false;
				Atp(p, "minigames", { pvp: true });
			} catch (e) {}
		if (q)
			try {
				p.runCommand(
					`execute as @s if block ~ -64 ~ deny 0 run testfor @p[name="${p.name}",scores={inv=!1},tag=!"br:ded"]`
				);
				q = false;
				Atp(p, "currentpos", { pvp: true });
			} catch (e) {}
		/*================ TOOL FUNCTIONS ===================*/
		if (XA.Entity.getHeldItem(p)?.typeId == "we:tool") {
			const lore = XA.Entity.getHeldItem(p).getLore();
			if (lore[0] == "Particle") {
				const q = new BlockRaycastOptions();
				q.maxDistance = 100;
				const block = p.getBlockFromViewVector(q);
				if (block) {
					world
						.getDimension("overworld")
						.spawnParticle(
							lore[1],
							new Location(
								block.location.x + 0.5,
								block.location.y + 1.5,
								block.location.z + 0.5
							),
							new MolangVariableMap()
						);
				}
			}
			if (lore[0] == "Stopsound") {
				p.runCommand("stopsound @s");
				p.runCommand("music stop");
			}
		}
		/*===================================================*/

		/*================== ПВП -сек =================*/
		if (wo.Q("server:pvpmode:enable"))
			try {
				p.runCommand("scoreboard players remove @s[scores={pvp=1..}] pvp 1");
			} catch (e) {}
		/*===================================================*/

		/*================== Другие таймеры =================*/
		if (wo.Q("timer:enable")) {
			Allsec.Eadd(p, 1);
			if (Allsec.Eget(p) >= 60) {
				Allmin.Eadd(p, 1);
				Allsec.Eset(p, 0);
			}
			if (Allmin.Eget(p) >= 60) {
				Allhrs.Eadd(p, 1);
				Allmin.Eset(p, 0);
			}
			Daysec.Eadd(p, 1);
			if (Daysec.Eget(p) >= 60) {
				Daymin.Eadd(p, 1);
				Daysec.Eset(p, 0);
			}
			if (Daymin.Eget(p) >= 60) {
				Dayhrs.Eadd(p, 1);
				Daymin.Eset(p, 0);
			}
			Seasec.Eadd(p, 1);
			if (Seasec.Eget(p) >= 60) {
				Seamin.Eadd(p, 1);
				Seasec.Eset(p, 0);
			}
			if (Seamin.Eget(p) >= 60) {
				Seahrs.Eadd(p, 1);
				Seamin.Eset(p, 0);
			}
		}
		if (Number(wo.Q("perm:data")) != Math.floor(Date.now() / 84400000)) {
			wo.set("perm:data", Date.now());
			Dayhrs.reset();
			Daymin.reset();
			Daysec.reset();
			world.say("Days reseted");
		}
		try {
			p.runCommand(
				"scoreboard players remove @s[scores={lockedtitle=1..}] lockedtitle 1"
			);
		} catch (e) {}
	}
}, 20);

/*
|--------------------------------------------------------------------------
* * Каждые две секунды
|--------------------------------------------------------------------------
|
| Звуки
| 
*/
setTickInterval(() => {
	//XA.Chat.runCommand('music stop')
	for (const p of world.getPlayers()) {
		if (XA.Entity.getHeldItem(p)?.typeId == "we:tool") {
			const lore = XA.Entity.getHeldItem(p).getLore();
			if (lore[0] == "Sound") {
				const s = {};
				//s.pitch = lore[2] ?? 0
				//s.volume = 4
				p.playSound(lore[1], s);
			}
		}
	}
}, 40);

/*
|--------------------------------------------------------------------------
? Команда
|--------------------------------------------------------------------------



new XA.Command(
  {
    name: "ы",
    description: "",
    requires: (p) => p.hasTag("commands"),
  }
  ).executes((ctx) => {

  }
);


*/

// new XA.Command({
// 	name: "test",
// 	description: "",
// 	requires: (p) => p.hasTag("commands"),
// }).executes((ctx) => {
// 	const block = world
// 		.getDimension("overworld")
// 		.getBlock(
// 			XA.Entity.locationToBlockLocation(ctx.sender.location).offset(0, -1, 0)
// 		);
// 	if (block.getComponent("inventory")?.container)
// 		return ctx.reply(
// 			toStr(block.getComponent("inventory")?.container, " ") +
// 				"\n" +
// 				toStr(block, " ")
// 		);
// 	ctx.reply("§cError");
// });

new XA.Command({
	name: "db",
	description: "",
	requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
	for (const key of Object.keys(XA.tables).filter((e) => e != "i")) {
		ctx.reply(key);
		const c = XA.tables[key].getCollection();
		const b = toStr(c, " ");
		ctx.reply(b);
	}
});

const casda = new XA.Command({
	name: "name",
	description: "",
	requires: (p) => p.hasTag("commands"),
})
	.string("Name")
	.executes((ctx) => {
		ctx.sender.nameTag = ctx.args.join("\n");
		console.warn(ctx.sender.name + " => " + ctx.sender.nameTag);
	});
casda.literal({ name: "reset", description: "Возвращает" }).executes((ctx) => {
	ctx.sender.nameTag = ctx.sender.name;
});

/*
|--------------------------------------------------------------------------
* * Активация режима пвп
|--------------------------------------------------------------------------
|
| 
| 
*/
world.events.entityHurt.subscribe(
	(data) => {
		if (
			data.cause != "fire" &&
			data.cause != "fireworks" &&
			data.cause != "projectile"
		)
			return;
		if (
			data.hurtEntity.typeId == "t:hpper_minecart" ||
			!wo.Q("server:pvpmode:enable") ||
			XA.Entity.getTagStartsWith(data.hurtEntity, "lockpvp:")
		)
			return;
		let lastHit = false;
		// @ts-ignore
		if (data.damage >= data.hurtEntity.getComponent("minecraft:health").current)
			lastHit = true;
		if (data?.damagingEntity instanceof Player) {
			//Всякая фигня без порядка
			XA.Chat.runCommand(`scoreboard objectives add pvp dummy`);
			data.damagingEntity.runCommandAsync(
				`scoreboard players set @s pvp ${
					wo.Q("server:pvpmode:cooldown") ? wo.Q("server:pvpmode:cooldown") : 15
				}`
			);
			stats.Hgive.Eadd(data.damagingEntity, data.damage);
			if (lastHit) stats.kills.Eadd(data.damagingEntity, 1);

			//Если лук, визуализируем
			if (data.cause == "projectile" && wo.Q("server:bowhit")) {
				if (po.Q("pvp:bowhitsound", data.damagingEntity))
					data.damagingEntity.playSound("", {
						location: data.damagingEntity.location,
						pitch: data.damage / 2,
						volume: 1,
					});

				if (
					po.Q("pvp:bowhittitle", data.damagingEntity) &&
					data.hurtEntity instanceof Player
				) {
					data.damagingEntity.onScreenDisplay.setActionBar(
						lastHit
							? XA.Lang.lang["title.kill.bow"](data.hurtEntity.name)
							: `§c-${data.damage}♥`
					);
					XA.Chat.runCommand(`scoreboard objectives add lockedtitle dummy`);
					data.damagingEntity.runCommandAsync(
						"scoreboard players set @s lockedtitle 2"
					);
				}
			}
			if (
				data.cause != "projectile" &&
				lastHit &&
				data.hurtEntity instanceof Player
			)
				data.damagingEntity.onScreenDisplay.setActionBar(
					XA.Lang.lang["title.kill.hit"](data.hurtEntity.name)
				);
		}
		if (data?.hurtEntity?.typeId != "minecraft:player") return;
		XA.Chat.runCommand(`scoreboard objectives add pvp dummy`);
		data.hurtEntity.runCommand(
			`scoreboard players set @s pvp ${
				wo.Q("server:pvpmode:cooldown") ? wo.Q("server:pvpmode:cooldown") : 15
			}`
		);
		stats.Hget.Eadd(data.hurtEntity, data.damage);
	},
	{ entities: [], entityTypes: ["t:hpper_minecart"] }
);

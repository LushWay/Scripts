import {
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

import { po, wo } from "../../lib/Class/XOptions.js";

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
import "./tool.js";
import { stats, time } from "./var.js";

/**
 * @type {import("@minecraft/server").ExplosionOptions}
 */
const boom = {
	breaksBlocks: false,
	causesFire: true,
};

XA.objectives.push({ id: "join", watch: true });

/*=========================================== ВЗРЫВНЫЕ ФЕЙРВЕРКИ ===========================================*/
setTickInterval(() => {
	for (const f of XA.dimensions.overworld.getEntities({ type: "fireworks_rocket" })) {
		if (
			XA.Entity.inRadius(
				// @ts-expect-error
				new Location(...wo.G("spawn:pos").split(" ")),
				XA.Entity.locationToBlockLocation(f.location),
				200
			)
		)
			continue;
		if (
			XA.Entity.inRadius(
				// @ts-expect-error
				new Location(...wo.G("minigames:pos").split(" ")),
				XA.Entity.locationToBlockLocation(f.location),
				50
			)
		)
			continue;
		if (!XA.Entity.getTagStartsWith(f, "l:")) {
			const sender = XA.Entity.getClosetsEntitys(f, 2, "minecraft:player", 1, false)[0];
			if (sender instanceof Player) {
				const lore = XA.Entity.getHeldItem(sender).getLore()[0];
				if (!lore || lore == "§r§н") continue;
				if (lore == "§r§б") f.addTag("блоки");
				if (lore == "§r§и") f.addTag("игроки");
				stats.FVlaunc.eAdd(sender, 1);
				f.addTag("l:" + sender.name);
			}
		}
		const type = f.hasTag("блоки") ? 2 : f.hasTag("игроки") ? 3 : 0;
		if (type == 0) continue;
		if (type == 2) {
			// TODO! Make check function
			if (true) {
				continue;
			} else boom.breaksBlocks = true;
		}

		if (type == 3)
			try {
				f.runCommand("testforblock ^^^1 air");
				f.runCommand("testforblock ^^^2 air");
				continue;
			} catch (e) {}
		let a = [...world.getPlayers()].find((e) => e.name == XA.Entity.getTagStartsWith(f, "l:"));
		if (a) stats.FVboom.eAdd(a, 1);
		f.dimension.createExplosion(f.location, type, boom);
		f.kill();
		boom.breaksBlocks = false;
	}
}, 0);

const obj = "lockedtitle";
XA.objectives.push({ id: obj, watch: true });

setTickInterval(() => {
	XA.runCommand(`scoreboard players add @a ${obj} 0`);
	for (const pl of world.getPlayers({ excludeTags: ["br:inGame"] }))
		if (
			pl.dimension.getBlock(XA.Entity.locationToBlockLocation(pl.location).offset(0, -64 - pl.location.y, 0))
				?.typeId === "minecraft:deny"
		)
			pl.triggerEvent("spawn");

	for (const ent of XA.dimensions.overworld.getEntities({
		families: ["monster"],
	}))
		if (
			ent.dimension.getBlock(XA.Entity.locationToBlockLocation(ent.location).offset(0, -64 - ent.location.y, 0))
				.typeId === "minecraft:deny"
		)
			XA.Entity.despawn(ent);
}, 0);

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
				const item2 = new ItemStack(Items.get(item.typeId), item.amount, item.data);
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
				if (m) item.setLore(["§r§б", "§r§fЦель ракет: §6блоки"]), (o = true), (item.nameTag = "§r§fРазрывная");
				if (mm) item.setLore(["§r§и", "§r§fЦель ракет: §6игроки"]), (o = true), (item.nameTag = "§r§fПодрыв жоп");
				if (!o) item.setLore(["§r§н", "§r§fБронебойность: §6блоки", "§r§fТройной выстрел: §6игроки"]);
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
				player.onScreenDisplay.setActionBar(`${q("»")} §6PvP: ${score} ${q("«")}`);
			}
		}

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
		for (const ent of XA.dimensions.overworld.getEntities({
			type: "mcbehub:inventory",
		})) {
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
					`execute positioned ${wo.Q("spawn:pos")} run testfor @p[name="${p.name}",scores={inv=!1},r=200,tag=!"br:ded"]`
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
							new Location(block.location.x + 0.5, block.location.y + 1.5, block.location.z + 0.5),
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
			time.all.seconds.eAdd(p, 1);
			if (time.all.seconds.eGet(p) >= 60) {
				time.all.minutes.eAdd(p, 1);
				time.all.seconds.eSet(p, 0);
			}
			if (time.all.minutes.eGet(p) >= 60) {
				time.all.hours.eAdd(p, 1);
				time.all.minutes.eSet(p, 0);
			}
			time.day.second.eAdd(p, 1);
			if (time.day.second.eGet(p) >= 60) {
				time.day.minutes.eAdd(p, 1);
				time.day.seconds.eSet(p, 0);
			}
			if (time.day.minutes.eGet(p) >= 60) {
				time.day.hours.eAdd(p, 1);
				time.day.minutes.eSet(p, 0);
			}
			time.anarchy.seconds.eAdd(p, 1);
			if (time.anarchy.seconds.eGet(p) >= 60) {
				time.anarchy.minutes.eAdd(p, 1);
				time.anarchy.seconds.eSet(p, 0);
			}
			if (time.anarchy.minutes.eGet(p) >= 60) {
				time.anarchy.hours.eAdd(p, 1);
				time.anarchy.minutes.eSet(p, 0);
			}
		}
		if (false && Number(wo.Q("perm:data")) != Math.floor(Date.now() / 84400000)) {
			wo.set("perm:data", Date.now());
			time.day.hours.reset();
			time.day.minutes.reset();
			time.day.seconds.reset();
			world.say("Days reseted");
		}
		try {
			p.runCommand("scoreboard players remove @s[scores={lockedtitle=1..}] lockedtitle 1");
		} catch (e) {}
	}
}, 20);

setTickInterval(() => {
	//XA.runCommand('music stop')
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
XA.objectives.push({ id: "pvp", watch: true });
world.events.entityHurt.subscribe(
	(data) => {
		if (data.cause != "fire" && data.cause != "fireworks" && data.cause != "projectile") return;
		if (
			data.hurtEntity.typeId == "t:hpper_minecart" ||
			!wo.Q("server:pvpmode:enable") ||
			XA.Entity.getTagStartsWith(data.hurtEntity, "lockpvp:")
		)
			return;
		let lastHit = false;
		// @ts-ignore
		if (data.damage >= data.hurtEntity.getComponent("minecraft:health").current) lastHit = true;
		if (data?.damagingEntity instanceof Player) {
			//Всякая фигня без порядка
			data.damagingEntity.runCommandAsync(
				`scoreboard players set @s pvp ${wo.Q("server:pvpmode:cooldown") ? wo.Q("server:pvpmode:cooldown") : 15}`
			);
			stats.Hgive.eAdd(data.damagingEntity, data.damage);
			if (lastHit) stats.kills.eAdd(data.damagingEntity, 1);

			//Если лук, визуализируем
			if (data.cause == "projectile" && wo.Q("server:bowhit")) {
				if (po.Q("pvp:bowhitsound", data.damagingEntity))
					data.damagingEntity.playSound("", {
						location: data.damagingEntity.location,
						pitch: data.damage / 2,
						volume: 1,
					});

				if (po.Q("pvp:bowhittitle", data.damagingEntity) && data.hurtEntity instanceof Player) {
					data.damagingEntity.onScreenDisplay.setActionBar(
						lastHit ? XA.Lang.lang["title.kill.bow"](data.hurtEntity.name) : `§c-${data.damage}♥`
					);
					data.damagingEntity.runCommandAsync("scoreboard players set @s lockedtitle 2");
				}
			}
			if (data.cause != "projectile" && lastHit && data.hurtEntity instanceof Player)
				data.damagingEntity.onScreenDisplay.setActionBar(XA.Lang.lang["title.kill.hit"](data.hurtEntity.name));
		}
		if (data?.hurtEntity?.typeId != "minecraft:player") return;
		data.hurtEntity.runCommand(
			`scoreboard players set @s pvp ${wo.G("server:pvpmode:cooldown") ? wo.G("server:pvpmode:cooldown") : 15}`
		);
		stats.Hget.eAdd(data.hurtEntity, data.damage);
	},
	{ entities: [], entityTypes: ["t:hpper_minecart"] }
);

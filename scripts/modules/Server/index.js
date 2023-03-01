import { MinecraftDimensionTypes, world } from "@minecraft/server";
import { setTickInterval, XA } from "xapi.js";

/**======================
 **       PLUGINS
 *========================**/
import "./pvp.js";
import "./tool.js";
import { options } from "./var.js";

XA.objectives.push({ id: "join", watch: true });

/*=========================================== ВЗРЫВНЫЕ ФЕЙРВЕРКИ ===========================================
setTickInterval(
	() => {
		for (const f of XA.dimensions.overworld.getEntities({ type: "fireworks_rocket" })) {
			if (
				XA.Entity.inRadius(
					// @ts-expect-error
					new Location(...wo.G("spawn:pos").split(" ")),
					XA.Utils.vecToBlockLocation(f.location),
					200
				)
			)
				continue;
			if (
				XA.Entity.inRadius(
					// @ts-expect-error
					new Location(...wo.G("minigames:pos").split(" ")),
					XA.Utils.vecToBlockLocation(f.location),
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
					stats.fireworksLaunched.eAdd(sender, 1);
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

			// if (type == 3)
			// 	try {
			// 		f.runCommandAsync("testforblock ^^^1 air");
			// 		f.runCommandAsync("testforblock ^^^2 air");
			// 		continue;
			// 	} catch (e) {}
			let a = [...world.getPlayers()].find((e) => e.name == XA.Entity.getTagStartsWith(f, "l:"));
			if (a) stats.fireworksExpoded.eAdd(a, 1);
			f.dimension.createExplosion(new Location(f.location.x, f.location.y, f.location.z), type, boom);
			f.kill();
			boom.breaksBlocks = false;
		}
	},
	0,
	"serverBoomShit"
);*/

// setTickInterval(
// 	() => {
// 		for (const pl of world.getPlayers({ excludeTags: ["br:inGame"] }))
// 			if (
// 				pl.dimension.getBlock(XA.Utils.vecToBlockLocation(pl.location).offset(0, -64 - pl.location.y, 0))?.typeId ===
// 				"minecraft:deny"
// 			)
// 				pl.triggerEvent("spawn");

// 		// for (const ent of XA.dimensions.overworld.getEntities({
// 		// 	families: ["monster"],
// 		// }))
// 		// 	if (
// 		// 		ent.dimension.getBlock(XA.Utils.vecToBlockLocation(ent.location).offset(0, -64 - ent.location.y, 0)).typeId ===
// 		// 		"minecraft:deny"
// 		// 	)
// 		// 		XA.Entity.despawn(ent);
// 	},
// 	0,
// 	"serverTpShit"
// );

setTickInterval(
	async () => {
		let players = [];
		for (const player of world.getPlayers()) {
			players.push(player.name);

			//*Фильтр предметов в инвентаре для Chest Gui
			// const inv = XA.Entity.getI(player);
			// for (let i = 0; i < inv.size; i++) {
			// 	const item = inv.getItem(i);
			// 	const lore = item?.getLore();
			// 	let lastInd, lastLore;
			// 	if (lore) (lastInd = lore.length - 1), (lastLore = lore[lastInd]);
			// 	if (
			// 		item &&
			// 		(item?.nameTag?.startsWith("§r§m§n§m") ||
			// 			item?.nameTag?.startsWith("§m§n§m") ||
			// 			(lastLore && lastLore?.endsWith("§{§-§}")))
			// 	) {
			// 		const item2 = new ItemStack(Items.get(item.typeId), item.amount, item.data);
			// 		inv.setItem(i, item2);
			// 	}
			// 	if (item && item.typeId == "minecraft:crossbow") {
			// 		/**
			// 		 * @type {EnchantmentList}
			// 		 */
			// 		let ench = item.getComponent("enchantments").enchantments,
			// 			o = false;
			// 		const mm = ench.getEnchantment(MinecraftEnchantmentTypes.multishot),
			// 			m = ench.getEnchantment(MinecraftEnchantmentTypes.piercing);
			// 		if (m) item.setLore(["§r§б", "§r§fЦель ракет: §6блоки"]), (o = true), (item.nameTag = "§r§fРазрывная");
			// 		if (mm) item.setLore(["§r§и", "§r§fЦель ракет: §6игроки"]), (o = true), (item.nameTag = "§r§fПодрыв жоп");
			// 		if (!o) item.setLore(["§r§н", "§r§fБронебойность: §6блоки", "§r§fТройной выстрел: §6игроки"]);
			// 		inv.setItem(i, item);
			// 	}
			// }

			/*================================ PVP MODE ==============================*/

			/*================== Блокировка незера =================*/
			if (options.lockNether) {
				if (player.dimension.id === MinecraftDimensionTypes.nether) {
					player.teleport(
						{ x: 0, z: 100, y: 0 },
						XA.dimensions.overworld,
						0,
						0
					);
					world.say(`§c► §f${player.name}§c Измерение "Незер" заблокированно.`);
				}
			}
		}
		/*================================ DEBUG2 ==============================*/
	},
	10,
	"serverAsyncShit"
); /*

/*

/*
|--------------------------------------------------------------------------
* * Каждую секунду
|--------------------------------------------------------------------------
|
| -sit, -base, TOOL, PVP -sec, Другие таймеры
| 

setTickInterval(
	() => {
		for (const p of world.getPlayers()) {
			// let q = true;
			//* Переключение инвентаря
			// if (q)
			// 	try {
			// 		p.runCommandAsync(
			// 			`execute positioned ${wo.Q("spawn:pos")} run testfor @p[name="${
			// 				p.name
			// 			}",scores={inv=!1},r=200,tag=!"br:ded"]`
			// 		);
			// 		q = false;
			// 		Atp(p, "spawn", { pvp: true });
			// 		new XA.instantDB(world, "pos").delete(p.id);
			// 	} catch (e) {}
			// if (q)
			// 	try {
			// 		p.runCommandAsync(
			// 			`execute positioned ${wo.Q("minigames:pos")} run testfor @p[name="${
			// 				p.name
			// 			}",scores={inv=!1},r=200,tag=!"br:ded"]`
			// 		);
			// 		q = false;
			// 		Atp(p, "minigames", { pvp: true });
			// 	} catch (e) {}
			// if (q)
			// 	try {
			// 		p.runCommandAsync(
			// 			`execute as @s if block ~ -64 ~ deny 0 run testfor @p[name="${p.name}",scores={inv=!1},tag=!"br:ded"]`
			// 		);
			// 		q = false;
			// 		Atp(p, "currentpos", { pvp: true });
			// 	} catch (e) {}
			/*================ TOOL FUNCTIONS ===================*/ /*
// if (XA.Entity.getHeldItem(p)?.typeId == "we:tool") {
// 	const lore = XA.Entity.getHeldItem(p).getLore();
// 	if (lore[0] == "Particle") {
// 		const block = p.getBlockFromViewVector({ maxDistance: 100 });
// 		if (block) {
// 			world
// 				.getDimension("overworld")
// 				.spawnParticle(
// 					lore[1],
// 					new Location(block.location.x + 0.5, block.location.y + 1.5, block.location.z + 0.5),
// 					new MolangVariableMap()
// 				);
// 		}
// 	}
// 	if (lore[0] == "Stopsound") {
// 		p.runCommandAsync("stopsound @s");
// 		p.runCommandAsync("music stop");
// 	}
// } /*

/*================== Другие таймеры =================
			if (false && wo.Q("timer:enable")) {
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
		}
	},
	20,
	"server20shitAgain"
);

setTickInterval(
	() => {
		for (const p of world.getPlayers()) {
			if (XA.Entity.getHeldItem(p)?.typeId == "we:tool") {
				const lore = XA.Entity.getHeldItem(p).getLore();
				if (lore[0] == "Sound") {
					p.playSound(lore[1]);
				}
			}
		}
	},
	40,
	"serverToolShit"
);
*/
/*
|--------------------------------------------------------------------------
* * Активация режима пвп
|--------------------------------------------------------------------------
|
| 
| 
*/

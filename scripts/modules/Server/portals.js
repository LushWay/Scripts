// @ts-nocheck

import {
	ItemStack,
	MinecraftBlockTypes,
	MinecraftItemTypes,
	Player,
	system,
	world,
} from "@minecraft/server";
import { DisplayError, XA } from "xapi.js";
import { rd } from "../Airdrops/index.js";
import { quene } from "../Battle Royal/var.js";
import { global } from "./var.js";

new WorldOption(
	"spawn:pos",
	"(x y z)\nТакже можно выставить через -spawn set <pos: Pos>",
	true
);
new WorldOption(
	"minigames:pos",
	"(x y z)\nТакже можно выставить через -mg set <pos: Pos>",
	true
);
const getSettings = XA.PlayerOptions("Atp", {
	showCoordinates: {
		desc: "Показывать координаты телепортации (выключите если вы стример)",
		value: true,
	},
	title: { desc: "", value: true },
});
/**
 *
 * @param {Player} player
 * @param {string} pos
 * @param {string} place
 * @param {boolean} resultActionbar
 * @returns void
 * @example tp(player, '0 0 0', 'spawn', po.Q('tp', player))
 */
function tp(
	player,
	pos,
	place,
	resultActionbar = false,
	obj,
	text,
	slow_falling,
	tpAnimation = true
) {
	if (tpAnimation) player.runCommandAsync("effect @s clear");
	if (slow_falling) player.runCommandAsync("effect @s slow_falling 17 1 true");
	let befplace;
	if (obj && obj.on) {
		let { P, C } = getPlace(obj.place, "");
		befplace = `§${C}◙ §3${P}§r > `;
	}

	let { P, C, rot } = getPlace(place, text);
	player.runCommandAsync(`tp ${pos}${rot != undefined ? ` ${rot}` : ""}`);
	if (resultActionbar)
		player.runCommandAsync(`title @s actionbar §${C}◙ §3${P} §${C}◙§r`);
	player.runCommandAsync(
		`tellraw @s {"rawtext":[{"translate":"${
			befplace ? befplace : ""
		}§${C}◙ §3${P}"}]}`
	);
}

/**
 *
 * @param {Player} player
 * @param {*} options
 */
function newtp(player, options) {
	const a = {
		player: Player,
		pos: "",
		place: "",
		befplace: false,
		obj: { on: "", place: "" },
		text: "",
		display_result_on_actionbar: false,
		slow_falling: false,
		animation: true,
	};
}

function getPlace(place, text) {
	let P = place,
		C = text,
		rot;
	if (place == "anarch") (P = "§cАнархия"), (C = "4");
	if (place == "spawn") (P = "§aСпавн"), (C = "2"), (rot = "0 0");
	if (place == "br") (P = "§6Батл рояль"), (C = "e"), (rot = "0 0");
	if (place == "minigames" || place == "currentpos")
		(P = "§dМиниигры§r"), (C = "5"), (rot = "0 0");
	return { P, C, rot };
}

class inventory {
	constructor() {
		this.gamerules = [
			"sendcommandfeedback:false",
			"keepinventory:false",
			"doimmediaterespawn:true",
			"showdeathmessages:false",
		];
		this.save = [];
		this.structureName = "i:$name";
		this.savezones = [
			{ x: 20, y: -62, z: 20 },
			{ x: 24, y: -62, z: 20 },
			{ x: 26, y: -62, z: 20 },
			{ x: 28, y: -62, z: 20 },
		];
		this.fillblocks = {
			air: [
				{ x: 0, y: 0, z: 0 },
				{ x: 0, y: 1, z: 0 },
			],
			bedrock: [
				{ x: 0, y: -1, z: 0 },
				{ x: -1, y: 0, z: 0 },
				{ x: 1, y: 0, z: 0 },
				{ x: 0, y: 0, z: -1 },
				{ x: 0, y: 0, z: 1 },
				{ x: -1, y: 1, z: 0 },
				{ x: 1, y: 1, z: 0 },
				{ x: 0, y: 1, z: -1 },
				{ x: 0, y: 1, z: 1 },
				{ x: 0, y: 2, z: 0 },
			],
		};
	}
	#gamerules(IsSet) {
		if (IsSet) {
			this.save = [];
			for (const g of this.gamerules) {
				XA.runCommandX(`gamerule ${g.split(":")[0]} ${g.split(":")[1]}`);
			}
		} else
			this.save.forEach((g) =>
				XA.runCommandX(`gamerule ${g.split(" = ")[0]} ${g.split(" = ")[1]}`)
			);
	}
	#setZone(bl) {
		this.fillblocks.bedrock.forEach((e) => {
			world
				.getDimension("overworld")
				.getBlock({ x: bl.x + e.x, y: bl.y + e.y, z: bl.z + e.z })
				.setType(MinecraftBlockTypes.bedrock);
		});
		this.fillblocks.air.forEach((e) => {
			world
				.getDimension("overworld")
				.getBlock({ x: bl.x + e.x, y: bl.y + e.y, z: bl.z + e.z })
				.setType(MinecraftBlockTypes.air);
		});
	}
	/**
	 *
	 * @param {number} i
	 * @param {Player} pl
	 * @returns
	 */
	async saveInv(i, pl) {
		const inv = XA.Entity.getI(pl);
		if (i != invs.anarch || inv.size == inv.emptySlotsCount) return;
		//console.warn("Сохранение инвентаря, старт");
		this.#gamerules(true);
		const zone = this.savezones.find(
			(e) =>
				world.getDimension("overworld").getEntitiesAtBlockLocation(e).length < 1
		);
		if (!zone) return world.say("§cError");
		this.#setZone(zone);
		pl.teleport(
			{ x: zone.x, y: zone.y, z: zone.z },
			world.getDimension("overworld"),
			0,
			0,
			false
		);
		await system.sleep(10);
		pl.addTag("saving");
		const name = pl.name;
		pl.kill();
		system.sleep(10).then((e) => {
			XA.runCommandX(
				`structure save ${this.structureName.replace("$name", pl.name)} ${
					zone.x
				} ${zone.y} ${zone.z} ${zone.x} ${zone.y + 1} ${zone.z} true disk false`
			);
			const a = XA.Entity.getAtPos({
				x: zone.x,
				y: zone.y,
				z: zone.z,
			}).length;
			XA.runCommandX(
				`kill @e[type=item,x=${zone.x},y=${zone.y},z=${zone.z},r=2]`
			);
			pl.tell(`Сохранено ${a} предметов`);
		});
		//console.warn("Сохранение инвентаря, прода");
		let C = 0;
		while ((await XA.runCommandX("testfor " + name)) < 1 && C < 100) {
			C++;
			await system.sleep(5);
		}

		//console.warn("Инвентарь сохранен");
		const player = XA.Entity.fetch(name);
		player.removeTag("saving");
		this.#gamerules(false);
	}
	/**
	 *
	 * @param {number} i
	 * @param {Player} pl
	 * @returns
	 */
	async loadInv(i, pl) {
		if (i != invs.anarch) {
			//console.warn("Загрузка стандартного инвентаря");
			XA.runCommandX(`clear ${pl.name}`);
			XA.runCommandX(
				`replaceitem entity ${pl.name} slot.hotbar 4 mcbehub:gui 1 0 {"item_lock":{"mode":"lock_in_slot"}}`
			);
		} else {
			//console.warn("Загрузка инвентаря анархии, старт");

			const zone = this.savezones.find(
				(e) =>
					world.getDimension("overworld").getEntitiesAtBlockLocation(e).length <
					1
			);
			if (!zone) return world.say("§cError");
			this.#setZone(zone);
			pl.teleport(
				{ x: zone.x, y: zone.y, z: zone.z },
				world.getDimension("overworld"),
				0,
				0,
				false
			);
			XA.runCommandX(`clear ${pl.name}`);
			XA.runCommandX(
				`structure load ${this.structureName.replace("$name", pl.name)} ${
					zone.x
				} ${zone.y} ${zone.z} 0_degrees none true false`
			);
			XA.runCommandX(
				`structure delete ${this.structureName.replace("$name", pl.name)}`
			);
			await system.sleep(1);
			while (
				world
					.getDimension("overworld")
					.getEntitiesAtBlockLocation(zone)
					.filter((e) => e.typeId == "minecraft:item").length > 0
			) {
				pl.runCommandAsync("title @s title §cОдень броню!");
				await system.sleep(3);
			}
			return;
			//console.warn('Загрузка завершена');
		}
	}
}
const inv = new inventory();

const invs = { spawn: 1, anarch: 2, minigames: 1, currentplace: 1, br: 1 };
const objective = ["inv"];
XA.objectives.push({ id: objective[0], watch: true });

/**
 *
 * @param {Player} player
 * @param {"spawn" | "anarch" | "minigames" | "currentpos" | "br"} [place]
 * @param {{pvp?: boolean; lock?: boolean; quene?: boolean}} [ignore]
 * @param {boolean} [setDefaultInventory]
 * @returns {void}
 * @example tp(player, 'spawn')
 */
export function Atp(player, place, ignore, setDefaultInventory) {
	const tag = XA.Entity.getTagStartsWith(player, "locktp:");

	/** @param {string} reason */
	const fail = (reason) => player.tell("§c► " + reason);

	if (!ignore?.lock && tag)
		return fail(`Сейчас это запрещено (префикс запрета: ${tag})`);

	if (!ignore?.quene && Object.keys(quene).includes(player.name))
		return fail(
			`Вы не можете телепортироваться, стоя в очереди. Выйти: §f-br quit`
		);

	if (!ignore?.pvp && XA.Entity.getScore(player, "pvp") > 0)
		return fail(`Вы находитесь в режиме PVP!`);

	const currentInventory = XA.Entity.getScore(player, objective[0]);
	const placeIndex = invs[place];
	if (!placeIndex)
		return DisplayError(new TypeError("Неправильное место: " + place));

	let pos = wo.G(`${place}:pos`);
	if (place !== "anarch" && place !== "currentpos" && !pos)
		return fail(`Админы забыли поставить точку телепортации для ${place}`);

	const settings = getSettings(player);

	let rtp = false,
		air = false;
	if (place === "anarch") {
		const getPos = XA.tables.player.get("POS:" + player.id);
		getPos ? (pos = getPos) : (rtp = true);
		if (currentInventory == invs.anarch && !rtp) return;
	} else if (place === "currentpos") {
		const l = Vector.floor(player.location);
		pos = l.x + " " + l.y + " " + l.z;
	}
	if (rtp) {
		const pcenter = wo.G("zone:center");
		const center = pcenter ? pcenter.split(", ").map(Number) : [0, 0];
		let y,
			x,
			z,
			count = 0;

		while (!y && count < 30) {
			count++;
			x = rd(
				Number(center[0]) + global.Radius - 10,
				Number(center[0]) - global.Radius + 10
			);
			z = rd(
				Number(center[1]) + global.Radius - 10,
				Number(center[1]) - global.Radius + 10
			);
			/** @type {import("@minecraft/server").BlockRaycastOptions} */
			const q = {};
			(q.includeLiquidBlocks = false), (q.includePassableBlocks = false);
			const b = world
				.getDimension("overworld")
				.getBlockFromRay({ x: x, y: 320, z }, { x: 0, y: -1, z: 0 });
			if (b && b.location.y >= 63) {
				y = b.location.y + 1;
				break;
			}
		}
		if (!y) {
			air = true;
			y = 200;
		}
		pos = x + " " + y + " " + z;
	}

	if (placeIndex == invs.anarch) {
		player.tell(
			`§r§${air ? "5Воздух" : "9Земля"}§r ${
				settings.showCoordinates ? "" : pos
			}`
		);
	}

	if (currentInventory == invs.anarch) {
		const l = Vector.floor(player.location);
		XA.tables.player.set("POS:" + player.id, l.x + " " + l.y + " " + l.z);
	}
	const inve = XA.Entity.getI(player);
	let obj = { on: false };
	if (Object.keys(invs).find((e) => invs[e] == currentInventory))
		obj = {
			on: true,
			place: Object.keys(invs).find((e) => invs[e] == currentInventory),
		};

	if (
		(currentInventory == placeIndex ||
			(inve.size == inve.emptySlotsCount && place != "anarch")) &&
		!(
			(!setDefaultInventory && inve.size == inve.emptySlotsCount) ||
			setDefaultInventory
		)
	) {
		tp(player, pos, place, settings.title, null, null, air);
		player.runCommandAsync(
			`scoreboard players set @s ${objective[0]} ${placeIndex}`
		);
	} else {
		try {
			if (!setDefaultInventory) player.runCommandAsync("testfor @s[m=!c]");
			inv.saveInv(currentInventory, player).then(() =>
				inv.loadInv(placeIndex, player).then(() => {
					player.runCommandAsync(
						`scoreboard players set @s ${objective[0]} ${placeIndex}`
					);
					tp(
						player,
						pos,
						place,
						settings.title,
						obj,
						null,
						air,
						(!setDefaultInventory && inve.size == inve.emptySlotsCount) ||
							place == "currentpos"
					);
				})
			);
		} catch (e) {
			player.runCommandAsync(
				`scoreboard players set @s ${objective[0]} ${placeIndex}`
			);
			tp(player, pos, place, settings.title, obj, null, air);
		}
	}
}

// world.events.beforeDataDrivenEntityTriggerEvent.subscribe((data) => {
// 	if (
// 		data.id !== "binocraft:on_death" ||
// 		XA.Entity.getScore(data.entity, objective[0]) !== invs.anarch ||
// 		data.entity.hasTag("saving")
// 	)
// 		return;
// 	stats.deaths.eAdd(data.entity, 1);
// 	if (data.entity.hasTag("br:alive")) return;
// 	data.cancel = true;
// 	const ent = data.entity.dimension.spawnEntity(
// 		"t:hpper_minecart",
// 		{ x: data.entity.location.x, y: data.entity.location.y + 0.2, z: data.entity.location.z }
// 	);
// 	//TODO! FIX
// 	// try {
// 	// 	data.entity.runCommandAsync("tp @e[type=item,r=4] @e[type=t:hpper_minecart,c=1]");
// 	// } catch (e) {
// 	// 	XA.Entity.despawn(ent);
// 	// 	return;
// 	// }
// 	data.entity.dimension.spawnEntity(
// 		"f:t",
// 		{ x: ent.location.x, y: ent.location.y, z: ent.location.z }
// 	).nameTag = `§6-=[§f${data.entity.nameTag}§6]=-`;
// });
// world.events.beforeDataDrivenEntityTriggerEvent.subscribe((data) => {
// 	if (data.id !== "ded") return;
// 	const c = XA.Entity.getClosetsEntitys(data.entity, 1, "f:t", 1, false)[0];
// 	c.nameTag = `§6-=[§f    §6]=-`;
// 	setTickTimeout(
// 		() => {
// 			c.nameTag = `§6-=[  ]=-`;
// 		},
// 		5,
// 		"nt"
// 	);

// 	setTickTimeout(
// 		() => {
// 			c.nameTag = `§6-=[ ]=-`;
// 		},
// 		10,
// 		"nt"
// 	);
// 	setTickTimeout(
// 		() => {
// 			c.nameTag = `§6-[]-`;
// 		},
// 		15,
// 		"nt"
// 	);
// 	setTickTimeout(
// 		() => {
// 			c.nameTag = `§6-`;
// 		},
// 		20,
// 		"nt"
// 	);
// 	setTickTimeout(
// 		() => {
// 			c.teleport({ x: 0, y: -64, z: 0 }, c.dimension, 0, 0);
// 			c.triggerEvent("kill");
// 		},
// 		25,
// 		"nt"
// 	);
// });
// setTickInterval(
// 	() => {
// 		for (const e of XA.Entity.getEntitys("t:hpper_minecart")) {
// 			const inv = XA.Entity.getI(e);
// 			if (inv.size === inv.emptySlotsCount) {
// 				e.triggerEvent("ded");
// 				e.kill();
// 			}
// 		}
// 	},
// 	20,
// 	"portal20shit"
// );
/**
setTickInterval(
	async () => {
		for (const p of world.getPlayers())
			p.runCommandAsync("execute as @s if block ~~-2~ bedrock if block ~~-3~ chest run event entity @s portal");
		const pos = wo
			.G("spawn:pos")
			?.split(" ")
			?.map((e) => Number(e));
		const pos2 = wo
			.G("minigames:pos")
			?.split(" ")
			?.map((e) => Number(e));
		for (const pl of world.getPlayers(qqq)) {
			if (
				pos &&
				XA.Entity.getScore(pl, "inv") == 1 &&
				!(await XA.Entity.hasItem(pl, "armor.chest", "elytra")) &&
				pl.location.y < pos[1] - 10
			) {
				try {
					pl.runCommandAsync(`execute positioned ${wo.Q("spawn:pos")} run testfor @a[name="${pl.name}",r=50]`);
					Atp(pl, "spawn", { pvp: true });
				} catch (e) {}
			} else {
				try {
					pl.runCommandAsync(`execute positioned ${wo.Q("spawn:pos")} run testfor @a[name="${pl.name}",r=200]`);
					if (pl.location.y < pos[1] - 50) Atp(pl, "spawn", { pvp: true });
				} catch (e) {}
				try {
					pl.runCommandAsync(`execute positioned ${wo.Q("spawn:pos")} run testfor @a[name="${pl.name}",rm=200,r=210]`);
					Atp(pl, "spawn", { pvp: true });
				} catch (e) {}
			}
			if (pos2 && pl.location.y < pos2[1] - 10) {
				try {
					pl.runCommandAsync(`execute positioned ${wo.Q("minigames:pos")} run testfor @a[name="${pl.name}",r=50]`);
					Atp(pl, "minigames", { pvp: true });
				} catch (e) {}
			}
		}
	},
	0,
	"portalShit"
);
*/

world.events.beforeDataDrivenEntityTriggerEvent.subscribe(
	(data) => {
		if (data.id !== "portal" || !(data.entity instanceof Player)) return;
		data.cancel = true;
		const to = world
			.getDimension(data.entity.dimension.id)
			.getBlock(Vector.floor(data.entity.location).offset(0, -3, 0));
		if (to.typeId !== "minecraft:chest") return;
		const toi = to.getComponent("inventory").container;
		const i = toi.getItem(0);
		if (!i) return;
		const lore = i.getLore()[0];
		if (!lore) return;
		if (!["anarch", "spawn", "br", "minigames", "currentpos"].includes(lore))
			return;
		// @ts-expect-error
		Atp(data.entity, lore);
	},
	{ eventTypes: ["portal"], entityTypes: ["minecraft:player"] }
);

new XA.Command({
	name: "hub",
	aliases: ["spawn", "tp"],
	description: "§bПеремещает на спавн",
	type: "public",
})
	.executes((ctx) => {
		Atp(ctx.sender, "spawn");
	})
	.literal({ name: "set", role: "admin" })
	.location("pos", true)
	.executes((ctx, pos) => {
		let loc = Vector.floor(pos ?? ctx.sender.location);
		const rl = loc.x + " " + loc.y + " " + loc.z;
		ctx.reply(rl);
		wo.set("spawn:pos", rl);
		ctx.sender.runCommandAsync("setworldspawn " + rl);
	});

new XA.Command({
	name: "minigames",
	aliases: ["mg"],
	description: "§bПеремещает на спавн минигр",
	type: "public",
})
	.executes((ctx) => {
		Atp(ctx.sender, "minigames");
	})
	.literal({ name: "set", role: "admin" })
	.location("pos", true)
	.executes((ctx, pos) => {
		let loc = Vector.floor(pos ?? ctx.sender.location);
		const rl = loc.x + " " + loc.y + " " + loc.z;
		ctx.reply(rl);
		wo.set("minigames:pos", rl);
	});

new XA.Command({
	name: "anarchy",
	aliases: ["anarch"],
	description: "§bПеремещает на анархию",
	type: "public",
})
	.executes((ctx) => {
		Atp(ctx.sender, "anarch");
	})
	.literal({ name: "set", role: "admin" })
	.location("pos", true)
	.executes((ctx, pos) => {
		let loc = Vector.floor(pos ?? ctx.sender.location);
		const rl = loc.x + " " + loc.y + " " + loc.z;
		ctx.reply(rl);
		wo.set("anarch:pos", rl);
	});

new XA.Command({
	name: "portal",
	aliases: ["port"],
	description: "Ставит портал",
	role: "admin",
})
	.string("lore")
	.executes((ctx) => {
		let item = new ItemStack(MinecraftItemTypes.grayCandle, 1, 0);
		item.setLore(ctx.args);
		const block = ctx.sender.dimension.getBlock(
			Vector.floor(ctx.sender.location).offset(0, -4, 0)
		);
		block.setType(MinecraftBlockTypes.chest);
		block.getComponent("inventory").container.setItem(0, item);
		const loc = Vector.floor(ctx.sender.location).offset(0, 1, 0);
		const l = { x: loc.x + 0.5, y: loc.y, z: loc.z + 0.5 };

		const rotation = ctx.sender.getRotation();
		ctx.sender.teleport(l, ctx.sender.dimension, rotation.x, rotation.y, false);

		ctx.reply(`§f► ${ctx.args.slice(1).join("§r, ")}`);
		ctx.sender.runCommandAsync("setblock ~~-3~ bedrock");
	});



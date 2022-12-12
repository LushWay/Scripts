import { BlockLocation, ItemStack, ItemTypes, Location } from "@minecraft/server";
import { IS, setTickInterval, XA } from "xapi.js";
import { global } from "../var.js";

const casda = new XA.Command({
	name: "name",
	description: "",
	requires: (p) => IS(p.id, "moderator"),
})
	.string("Name")
	.executes((ctx) => {
		ctx.sender.nameTag = ctx.args.join("\n");
		console.warn(ctx.sender.name + " => " + ctx.sender.nameTag);
	});
casda.literal({ name: "reset", description: "Возвращает" }).executes((ctx) => {
	ctx.sender.nameTag = ctx.sender.name;
});

const daily_reward_hours = 24;
const kit = new XA.Command({
	name: "kit",
	description: "Выдает кит",
	/*type: "public"*/
});
kit.string("name", true).executes((ctx, name) => {
	const ALLkits = XA.tables.kits.keys();
	if (ALLkits.length < 1) return ctx.reply("§сНет китов");
	const kits = ALLkits.filter((e) => e.split(":")[0] == "any" || ctx.sender.hasTag(e.split(":")[0]));
	if (kits.length < 1) return ctx.reply("§сНет доступных китов");
	let kkits = [],
		avaible = {},
		unavaible = [];
	for (const kit of kits) {
		const cooldown = Number(
			ctx.sender
				.getTags()
				.find((tag) => tag.startsWith(kit.split(":")[1]))
				?.substring(kit.split(":")[1].length + 1) ?? 0
		);

		if (cooldown > Date.now()) {
			const hrs = Math.ceil((cooldown - Date.now()) / 3.6e6) + "";
			let o;
			if (hrs.endsWith("1") && hrs != "11") {
				o = "час §cостался!";
			} else if (hrs.endsWith("2") || hrs.endsWith("3") || hrs.endsWith("4")) {
				o = `часa §cосталось`;
			} else {
				o = `часов §cосталось`;
			}
			unavaible.push(kit.split(":")[1] + ":" + hrs + " " + o);
			kkits.push(`§7${kit.split(":")[1]} §с(§b${hrs} ${o})`);
		} else {
			avaible[kit.split(":")[1]] = {
				tag: kit.split(":")[0],
				cd: kit.split(":")[2],
			};
			kkits.push(`§7${kit.split(":")[1]} §6(Доступно)`);
		}
	}
	if (!name) return ctx.reply("§fДоступные киты: \n  §7" + kkits.join("\n  "));
	if (!avaible[name]) {
		if (unavaible.find((e) => e.split(":")[0] == name))
			return ctx.reply(
				`§cКит §6${name}§c был взят недавно. §b${unavaible.find((e) => e.split(":")[0] == name).split(":")[1]}`
			);
		return ctx.reply(`§cКита с названием §6${name}§c не существует`);
	}
	XA.Entity.removeTagsStartsWith(ctx.sender, `${name}:`);
	ctx.sender.addTag(`${name}:${Date.now() + avaible[name].cd * 3.6e6}`);
	const kit = XA.tables.kits.get(avaible[name].tag + ":" + name + ":" + avaible[name].cd);
	kit.forEach((e) => ctx.sender.runCommandAsync(`give @s ${e}`));
	ctx.reply(`§7Получен кит §6${name}§7!`); //§r
});
kit.literal({ name: "all", description: "Выдает все киты" }).executes((ctx) => {
	const ALLkits = XA.tables.kits.keys();
	if (ALLkits.length < 1) return ctx.reply("§сНет китов");
	const kits = ALLkits.filter((e) => e.split(":")[0] == "any");
	if (kits.length < 1) return ctx.reply("§сНет доступных китов");
	let kkits = [],
		avaible = {},
		unavaible = [];
	for (const kit of kits) {
		const cooldown = Number(
			ctx.sender
				.getTags()
				.find((tag) => tag.startsWith(kit.split(":")[1]))
				?.substring(kit.split(":")[1].length + 1) ?? 0
		);
		if (cooldown > Date.now()) {
			const hrs = Math.ceil((cooldown - Date.now()) / 3.6e6) + "";
			let o;
			if (hrs.endsWith("1")) {
				o = "час §cостался!";
			} else if (hrs.endsWith("2") || hrs.endsWith("3") || hrs.endsWith("4")) {
				o = `часa §cосталось`;
			} else {
				o = `часов §cосталось`;
			}
			unavaible.push(kit.split(":")[1] + ":" + hrs + " " + o);
			kkits.push(`§7${kit.split(":")[1]} §с(§b${hrs} ${o})`);
		} else {
			avaible[kit.split(":")[1]] = kit.split(":")[0];
			kkits.push(`§7${kit.split(":")[1]} §6(Доступно)`);
			XA.Entity.removeTagsStartsWith(ctx.sender, `${kit.split(":")[1]}:`);
			ctx.sender.addTag(`${kit.split(":")[1]}:${Date.now() + Number(kit.split(":")[2]) * 3.6e6}`);
			const kiit = XA.tables.kits.get(kit);
			kiit.forEach((e) => ctx.sender.runCommandAsync(`give @s ${e}`));
		}
	}
	ctx.reply(`§7Получены киты: §6${Object.keys(avaible).join(", ")}§7!`);
});
kit
	.literal({
		name: "add",
		description: "Добавляет",
		requires: (p) => IS(p.id, "moderator"),
	})
	.string("tag")
	.string("name")
	.int("cdhours", true)
	.executes((ctx, name, tag, cdhours) => {
		const wb = ctx.sender.dimension.getBlock(
			new BlockLocation(
				Math.floor(ctx.sender.location.x),
				Math.floor(ctx.sender.location.y),
				Math.floor(ctx.sender.location.z)
			)
		);
		const b = wb.getComponent("inventory")?.container;
		if (!b) return ctx.reply("§cВстань на сундук с китом! (блок: " + wb.typeId + ")");
		let inv = [];
		for (let i = 0; i < b.size; i++) {
			/** * @type {ItemStack} */ const item = b.getItem(i);
			if (item) inv.push(item.typeId + " " + item.amount + " " + item.data);
		}
		ctx.reply(`§fДобавлен кит с такими предметами:\n  §7` + inv.join("\n  "));
		let cd = daily_reward_hours;
		if (cdhours || cdhours == 0) cd = cdhours;
		XA.tables.kits.set(tag + ":" + name + ":" + cd, inv);
	});
kit
	.literal({
		name: "set",
		description: "Добавляет",
		requires: (p) => IS(p.id, "moderator"),
	})
	.string("name")
	.executes((ctx, name) => {
		const n = XA.tables.kits.keys().find((e) => e.split(":")[1].endsWith(name));
		if (!n)
			return ctx.reply(
				`§cКита с названием '§f${name}§c' не существует. \n§fДоступные киты: \n  §7` +
					XA.tables.kits.keys().join("\n  ")
			);
		const wb = ctx.sender.dimension.getBlock(
			new BlockLocation(
				Math.floor(ctx.sender.location.x),
				Math.floor(ctx.sender.location.y),
				Math.floor(ctx.sender.location.z)
			)
		);
		const b = wb.getComponent("inventory")?.container;
		if (!b) return ctx.reply("§cВстань на сундук с китом! (блок: " + wb.typeId + ")");
		let inv = [];
		for (let i = 0; i < b.size; i++) {
			/** * @type {ItemStack} */ const item = b.getItem(i);
			if (item) inv.push(item.typeId + " " + item.amount + " " + item.data);
		}
		ctx.reply(`§fДобавлен кит с такими предметами:\n  §7` + inv.join("\n  "));
		XA.tables.kits.set(n, inv);
	});
kit
	.literal({
		name: "del",
		description: "ДЦт",
		requires: (p) => IS(p.id, "moderator"),
	})
	.string("name")
	.executes((ctx, name) => {
		const n = XA.tables.kits.keys().find((e) => e.split(":")[1].endsWith(name));
		if (!n)
			return ctx.reply(
				`§cКита с названием '§f${name}§c' не существует. \n§fДоступные киты: \n  §7` +
					XA.tables.kits.keys().join("\n  ")
			);
		ctx.reply(`§7Удален кит с такими названием: §6${n}§r`);
		XA.tables.kits.delete(n);
	});
kit
	.literal({ name: "red", description: "Редактирует кит" })
	.string("name")
	.executes((ctx, name) => {
		const kits = XA.tables.kits.keys();
		if (kits.length < 1) return ctx.reply("§сНет китов");
		const n = kits.find((e) => e.split(":")[1].endsWith(name));
		if (!n)
			return ctx.reply(
				`§cКита с названием '§f${name}§c' не существует. \n§fДоступные киты: \n  §7` +
					XA.tables.kits.keys().join("\n  ")
			);
		const kit = XA.tables.kits.get(n);
		ctx.sender.runCommandAsync("setblock ~~~ chest");
		/** * @type {BlockInventoryComponentContainer} */ const inv = ctx.sender.dimension
			.getBlock(XA.Entity.vecToBlockLocation(ctx.sender.location))
			.getComponent("inventory").container;
		for (const [i, k] of kit.entries()) {
			inv.setItem(
				i,
				new ItemStack(
					ItemTypes.get(k.split(" ")[0].includes(":") ? k.split(" ")[0] : "minecraft:" + k.split(" ")[0]),
					Number(k.split(" ")[1]),
					Number(k.split(" ")[2])
				)
			);
		}
		ctx.reply(`§7Редактирование кита §6${name}§7! Когда закончишь, встань на сундук и пропиши §f-kit set ${name}`);
	});
new XA.Command({
	name: "resetpos",
	description: "Удаляет информацию о позиции  на анархии",
	/*type: "public"*/
}).executes((ctx) => {
	ctx.reply(XA.tables.player.delete("POS:" + ctx.sender.id) + "");
});
new XA.Command({
	name: "radius",
	description: "Выдает радиус границы анархии сейчас",
	/*type: "public"*/
}).executes((ctx) => {
	ctx.reply(`☺ ${global.Radius}`);
});

new XA.Command({ name: "sit", description: "" /*type: "public"*/ }).executes((ctx) => {
	const entity = ctx.sender.dimension.spawnEntity(
		"s:it",
		new Location(ctx.sender.location.x, ctx.sender.location.y - 0.1, ctx.sender.location.z)
	);
	entity.addTag("sit:" + ctx.sender.name);
	entity.getComponent("rideable").addRider(ctx.sender);
});
setTickInterval(
	() => {
		for (const e of XA.Entity.getEntitys("s:it")) {
			const players = XA.Entity.getClosetsEntitys(e, 1, "minecraft:player", 1, false);
			if (players.length < 1) e.triggerEvent("kill");
		}
	},
	20,
	"sit entity clear"
);

const cos = new XA.Command({
	name: "i",
	description: "Создает динамический список предметов",
	requires: (p) => IS(p.id, "moderator"),
	/*type: "test"*/
});
cos
	.literal({
		name: "add",
		description: "Добавляет предмет в руке в список",
	})
	.string("id")
	.executes((ctx, id) => {
		ctx.reply("Зарегано под айди: " + XA.tables.i.add(XA.Entity.getHeldItem(ctx.sender), id));
	});
cos
	.literal({ name: "get" })
	.string("lore")
	.executes((ctx, lore) => {
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, XA.tables.i.get(lore));
	});
cos
	.literal({ name: "del" })
	.string("lore")
	.executes((ctx, lore) => {
		ctx.reply(XA.tables.i.delete(lore));
	});
cos.literal({ name: "list" }).executes((ctx) => {
	const ii = []; //XA.tables.i.items();
	if (ii.length > 1) {
		let ab = [];
		ii.filter((e) => ab.push(e.typeId + " (§r " + e.getLore().join(", ") + " §r)"));
		ctx.reply(ab.sort().join("\n"));
	} else {
		ctx.reply("§cПусто.");
	}
});

new XA.Command({
	name: "ws",
	description: "Выдает/убирает меню из инвентаря",
	requires: (p) => IS(p.id, "admin"),
	/*type: "serv"*/
}).executes(async (ctx) => {
	if (await XA.Entity.hasItem(ctx.sender, 0, "sa:a")) {
		XA.runCommandX(`clear "${ctx.sender.name}" sa:a`);
		ctx.reply("§a► §fМеню убрано.");
	} else {
		XA.runCommandX(`give "${ctx.sender.name}" sa:a`);
		ctx.reply("§a► §fМеню выдано.");
	}
});
new XA.Command({
	name: "s",
	description: "Выжа",
	requires: (p) => IS(p.id, "moderator"),
	/*type: "serv"*/
}).executes((ctx) => {
	ctx.sender.runCommandAsync("gamemode s");
	ctx.reply("§a► S");
});
new XA.Command({
	name: "c",
	description: "Креатив",
	requires: (p) => IS(p.id, "moderator"),
	/*type: "serv"*/
}).executes((ctx) => {
	ctx.sender.runCommandAsync("gamemode c");
	ctx.reply("§a► C");
});

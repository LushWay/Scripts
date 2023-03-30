import { system, Vector } from "@minecraft/server";
import { XA } from "xapi.js";
import { global } from "../var.js";

const casda = new XA.Command({
	name: "name",
	description: "",
	role: "moderator",
})
	.string("Name")
	.executes((ctx) => {
		ctx.sender.nameTag = ctx.args.join("\n");
		console.warn(ctx.sender.name + " => " + ctx.sender.nameTag);
	});
casda.literal({ name: "reset", description: "Возвращает" }).executes((ctx) => {
	ctx.sender.nameTag = ctx.sender.name;
});

new XA.Command({
	name: "resetpos",
	description: "Удаляет информацию о позиции  на анархии",
	type: "public",
	role: "member",
}).executes((ctx) => {
	ctx.reply(XA.tables.player.delete("POS:" + ctx.sender.id) + "");
});
new XA.Command({
	name: "radius",
	description: "Выдает радиус границы анархии сейчас",
	type: "public",
	role: "member",
}).executes((ctx) => {
	ctx.reply(`☺ ${global.Radius}`);
});

new XA.Command({
	name: "sit",
	description: "",
	type: "public",
	role: "member",
}).executes((ctx) => {
	const entity = ctx.sender.dimension.spawnEntity(
		"x:sit",
		Vector.add(ctx.sender.location, { x: 0, y: -0.1, z: 0 })
	);
	entity.getComponent("rideable").addRider(ctx.sender);
});

system.runInterval(
	() => {
		for (const e of XA.dimensions.overworld.getEntities({ type: "x:sit" })) {
			const players = e.dimension.getEntities({
				type: "minecraft:player",
				location: e.location,
				maxDistance: 1,
			});
			if (players.length < 1) e.triggerEvent("sit:kill");
		}
	},
	"sit entity clear",
	40
);

const cos = new XA.Command({
	name: "i",
	description: "Создает динамический список предметов",
	role: "moderator",
	type: "test",
});
cos
	.literal({
		name: "add",
		description: "Добавляет предмет в руке в список",
	})
	.string("id")
	.executes((ctx, id) => {
		ctx.reply(
			"Зарегано под айди: " +
				XA.tables.i.add(XA.Entity.getHeldItem(ctx.sender), id)
		);
	});
cos
	.literal({ name: "get" })
	.string("lore")
	.executes((ctx, lore) => {
		XA.Entity.getI(ctx.sender).setItem(
			ctx.sender.selectedSlot,
			XA.tables.i.get(lore)
		);
	});
cos
	.literal({ name: "del" })
	.string("lore")
	.executes((ctx, lore) => {
		ctx.reply(XA.tables.i.delete(lore));
	});
cos.literal({ name: "list" }).executes((ctx) => {
	const ii = XA.tables.i.items();
	if (ii.length > 1) {
		ctx.reply(
			ii
				.map((e) => `${e.typeId} (§r ${e.getLore().join(", ")} §r)`)
				.sort()
				.join("\n")
		);
	} else {
		ctx.reply("§cПусто.");
	}
});

new XA.Command({
	name: "ws",
	description: "Выдает/убирает меню из инвентаря",
	role: "admin",
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
	role: "moderator",
	/*type: "serv"*/
}).executes((ctx) => {
	ctx.sender.runCommandAsync("gamemode s");
	ctx.reply("§a► S");
});
new XA.Command({
	name: "c",
	description: "Креатив",
	role: "moderator",
	/*type: "serv"*/
}).executes((ctx) => {
	ctx.sender.runCommandAsync("gamemode c");
	ctx.reply("§a► C");
});


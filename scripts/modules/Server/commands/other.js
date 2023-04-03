import { system, world } from "@minecraft/server";
import { XA } from "xapi.js";

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
	name: "sit",
	description: "",
	type: "public",
	role: "member",
}).executes(async (ctx) => {
	const entity = ctx.sender.dimension.spawnEntity("x:sit", ctx.sender.location);
	ctx.sender.closeChat();
	// Rideable component doesnt workы
	entity.runCommand("ride @p start_riding @s teleport_rider ");

	await Promise.resolve();
	ctx.sender.onScreenDisplay.setActionBar("Вы сели. Чтобы встать, крадитесь");
});

system.runInterval(
	() => {
		for (const e of world.overworld.getEntities({ type: "x:sit" })) {
			const players = e.dimension.getEntities({
				type: "minecraft:player",
				location: e.location,
				maxDistance: 2,
			});

			if (players.length < 1) {
				e.triggerEvent("sit:kill");
			}
		}
	},
	"sit entity clear",
	40
);

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
	description: "Выживание",
	role: "moderator",
	/*type: "serv"*/
}).executes((ctx) => {
	ctx.sender.runCommand("gamemode s");
	ctx.reply("§a► S");
});

new XA.Command({
	name: "c",
	description: "Креатив",
	role: "moderator",
	/*type: "serv"*/
}).executes((ctx) => {
	ctx.sender.runCommand("gamemode c");
	ctx.reply("§a► C");
});

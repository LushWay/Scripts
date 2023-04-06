import { system, world } from "@minecraft/server";

new XA.Command({
	name: "sit",
	description: "",
	type: "public",
	role: "member",
}).executes(async (ctx) => {
	const entity = ctx.sender.dimension.spawnEntity("x:sit", ctx.sender.location);
	ctx.sender.closeChat();
	// Rideable component doesnt works
	entity.runCommand("ride @p start_riding @s teleport_rider ");

	await nextTick;
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

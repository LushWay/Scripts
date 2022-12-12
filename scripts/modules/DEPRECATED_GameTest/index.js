import { BlockLocation, MinecraftBlockTypes, world } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { IS, setTickInterval, sleep, XA } from "xapi.js";

const Options = XA.WorldOptions("simulatedPlayer", {
	name: { value: "", desc: "Имя бота" },
	time: { value: 0, desc: "Время бота" },
});

let name = Options.name;
let time = Options.time;

GameTest.registerAsync("s", "s", async (test) => {
	world.say(`На игры с ботиком даю вам ${time} тиков`);
	const spawnLoc = new BlockLocation(1, 5, 1);
	const player = test.spawnSimulatedPlayer(spawnLoc, name);

	const end = setTickInterval(() => {
		if (!player || XA.Entity.isDead(player)) test.fail("Игрок сдох");
		player.nameTag = name + "\n" + time;
		time--;
	});
	await sleep(time);
	end();
})
	.maxTicks(time + 20)
	.structureName("ComponentTests:platform")
	.tag(GameTest.Tags.suiteDisabled);

const cmd = new XA.Command({
	name: "player",
	description: "Спавнит фэйкового игрока",
	requires: (p) => IS(p.id, "admin"),
	/*type: "test"*/
}).executes(async (ctx) => {
	const o = world.getDimension("overworld").getBlock(new BlockLocation(10, 63, 13));
	o.setType(MinecraftBlockTypes.redstoneBlock);
	await sleep(10);
	console.log(world.getDimension("overworld").getBlock(new BlockLocation(10, 63, 13)).typeId);
	XA.runCommandX(`tp "${name}" "${ctx.sender.name}"`);
	// ctx.sender.runCommandAsync("gametest runthis");
});
cmd
	.literal({ name: "name" })
	.string("new name")
	.executes((ctx, newname) => {
		ctx.reply(name + " > " + newname);
		name = newname;
		Options.name = newname;
	});

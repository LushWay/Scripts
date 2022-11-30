import { BlockLocation, MinecraftBlockTypes, world } from "@minecraft/server";
import * as GameTest from "mojang-gametest";
import { IS, sleep, XA } from "xapi.js";
import { wo } from "../../lib/Class/XOptions.js";

let name = wo.G("simulatedplayer:name") ?? "Simulated",
	time = Number(wo.G("simulatedplayer:time"));
//log(time + ' ' + wo.QQ("simulatedplayer:time", true, true) + " " + name);
GameTest.registerAsync("sim", "spawn", async (test) => {
	let suc = false;
	world.say(`На игры с ботиком даю вам ${time} тиков`);
	const spawnLoc = new BlockLocation(1, 5, 1);
	const pl = test.spawnSimulatedPlayer(spawnLoc, name);
	test.idle(time).then(() => {
		suc = true;
	});
	let e = world.events.tick.subscribe(() => {
		// @ts-ignore
		if (!pl || XA.Entity.isDead(pl)) test.fail("Игрок сдох");
		pl.nameTag = name + "\n" + time;
		time--;
		if (suc) world.events.tick.unsubscribe(e);
	});
})
	.maxTicks(time + 20)
	.structureName("ComponentTests:platform")
	.tag(GameTest.Tags.suiteDebug);

const cmd = new XA.Command({
	name: "player",
	description: "Спавнит фэйкового игрока",
	requires: (p) => IS(p.id, "admin"),
	/*type: "test"*/
}).executes(async (ctx) => {
	const o = world.getDimension("overworld").getBlock(new BlockLocation(10, 63, 13));
	o.setType(MinecraftBlockTypes.redstoneBlock);
	await sleep(10);
	console.log(world.getDimension("overworld").getBlock(new BlockLocation(10, 63, 13)).type.id);
	XA.runCommandX(`tp "${name}" "${ctx.sender.name}"`);
	// ctx.sender.runCommandAsync("gametest runthis");
});
cmd
	.literal({ name: "name" })
	.string("aname")
	.executes((ctx, aname) => {
		ctx.reply(name + " > " + aname);
		name = aname;
		wo.set("simulatedplayer:name", aname);
	});

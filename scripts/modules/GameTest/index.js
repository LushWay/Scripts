import {
	BlockLocation,
	GameMode,
	MinecraftBlockTypes,
	world,
} from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { handle, IS, setTickInterval, sleep, XA } from "xapi.js";

const Options = XA.WorldOptions("simulatedPlayer", {
	name: { value: "", desc: "Имя бота" },
	time: { value: 1500, desc: "Время бота" },
});

let name = Options.name;
let time = Options.time;

GameTest.registerAsync("s", "s", async (test) => {
	world.say(`На игры с ботиком даю вам ${time} тиков`);
	const spawnLoc = new BlockLocation(1, 5, 1);
	const player = test.spawnSimulatedPlayer(spawnLoc, name);

	const end = setTickInterval(
		() => {
			if (!player || XA.Entity.isDead(player)) test.fail("Игрок сдох");
			player.nameTag = name + "\n" + time;
			time--;
		},
		0,
		"simulatedPlayer"
	);
	await sleep(time);
	end();
})
	.maxTicks(time + 20)
	.structureName("Component:grass5x5")
	.tag("sim");

const cmd = new XA.Command({
	name: "player",
	description: "Спавнит фэйкового игрока",
	requires: (p) => IS(p.id, "admin"),
	type: "test",
}).executes(async (ctx) => {
	const o = world
		.getDimension("overworld")
		.getBlock(new BlockLocation(10, 63, 13));
	o.setType(MinecraftBlockTypes.redstoneBlock);
	await sleep(10);
	console.log(
		world.getDimension("overworld").getBlock(new BlockLocation(10, 63, 13))
			.typeId
	);
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

/**
 *
 * @param {number} max
 * @param {number} min
 * @param {boolean} msg
 * @returns
 */

GameTest.registerAsync("s", "m", async (test) => {
	let succeed = false;
	for (let e = 0; e < 5; e++) {
		const player = test.spawnSimulatedPlayer(
			new BlockLocation(-1, 3, -1),
			"Tester (" + e + ")",
			GameMode.adventure
		);
		player.setVelocity({ x: rd(1, 0), y: rd(1), z: rd(1, 0) });
		await test.idle(Math.random() * 50);
		handle(async () => {
			while (!succeed) {
				await test.idle(Math.random() * 40);
				if (!player) break;
				const net = XA.Entity.getClosetsEntitys(
					player,
					5,
					"minecraft:player"
				)[0];
				if (!net) continue;
				player.lookAtEntity(net);
				await test.idle(20);
				// player.stopMoving();
				// world.say(toStr(net.location));
				// player.moveToLocation(new Location(net.location.x, net.location.y, net.location.z), 1);
				// await test.idle(rd(30, 10));
				// player.attackEntity(net);
			}
		});
	}
	await test.idle(1000);
	succeed = true;
	test.succeed();
})
	.maxTicks(1500)
	.structureName("Component:grass5x5")
	.tag("sim");

function rd(max, min = 0, msg = false) {
	if (max == min || max < min) return max;

	const rd = Math.round(min + Math.random() * (max - min));
	if (msg) world.say(msg + "\nmax: " + max + " min: " + min + " rd: " + rd);
	return rd;
}

import {
	GameMode,
	MinecraftBlockTypes,
	Vector,
	world,
	system,
} from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { handle, IS, XA } from "xapi.js";
import { DIMENSIONS } from "../../lib/List/dimensions.js";

const time = 9999999;

let name = "Бот";
/** @type {GameTest.SimulatedPlayer} */
let simp;
const test_loc = { x: 1000, y: -60, z: 1000 };

GameTest.registerAsync("s", "s", async (test) => {
	const spawnLoc = { x: 1, y: 5, z: 1 };
	simp = test.spawnSimulatedPlayer(spawnLoc, name);

	await test.idle(time - 30);
	test.succeed();
})
	.maxTicks(time)
	.structureName("Component:grass5x5")
	.tag("sim");

new XA.Command({
	name: "player",
	description: "Спавнит фэйкового игрока",
	requires: (p) => IS(p.id, "admin"),
	type: "test",
})
	.string("new name", true)
	.executes(async (ctx, newname) => {
		if (newname) name = newname;

		await XA.runCommandX(
			`execute positioned ${test_loc.x} ${test_loc.y} ${test_loc.z} run gametest create "s:s"`
		);

		DIMENSIONS.overworld
			.getBlock(Vector.add(test_loc, { x: 1, y: 0, z: 1 }))
			.setType(MinecraftBlockTypes.redstoneBlock);

		await system.sleep(10);

		simp.teleport(ctx.sender.location);
	});

// Many players
GameTest.registerAsync("s", "m", async (test) => {
	let succeed = false;
	for (let e = 0; e < 5; e++) {
		const player = test.spawnSimulatedPlayer(
			{ x: -1, y: 3, z: -1 },
			"Tester (" + e + ")",
			GameMode.adventure
		);
		player.applyImpulse({ x: rd(1, 0), y: rd(1), z: rd(1, 0) });
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
				// player.moveToLocation({ x: net.location.x, net.location.y, y: net.location.z), z: 1 };
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

/**
 *
 * @param {number} max
 * @param {number} min
 * @param {boolean} msg
 * @returns
 */
function rd(max, min = 0, msg = false) {
	if (max == min || max < min) return max;

	const rd = Math.round(min + Math.random() * (max - min));
	if (msg) world.say(msg + "\nmax: " + max + " min: " + min + " rd: " + rd);
	return rd;
}

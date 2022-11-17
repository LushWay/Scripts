import { Log, sleep, ThrowError, toStr, XA } from "xapi.js";
import {
	BlockLocation,
	BlockType,
	MinecraftBlockTypes,
	Player,
	world,
} from "@minecraft/server";
import { CommandCallback } from "../../lib/Command/Callback.js";

/**
 * @type {Object<string, (ctx?: CommandCallback) => void | Promise>}
 */
const tests = {
	1: (ctx) => {
		const o = new XA.cacheDB(ctx.sender, "test"),
			data = o.data;
		data.val = 34;
		data.ee = "ee";
		o.safe();
	},
	2: (ctx) => {
		const o = new XA.instantDB(ctx.sender, "test");

		o.set("c", "e");

		Log(toStr(o.data));
	},
	3: async (ctx) => {
		try {
			await tests[4]();
		} catch (error) {}
		await sleep(20);

		/**
		 * @typedef {{x: number, z: number}} IRegionCords
		 */

		/** @type {IRegionCords[]} */
		const regs = [];

		const size = 1; // size
		const size2 = size / 2;

		/**
		 * @param {IRegionCords} center
		 * @param {number} x
		 * @param {number} z
		 * @returns {IRegionCords}
		 */
		function moveCenter(center, x, z) {
			return { x: center.x + x * size, z: center.z + z * size };
		}

		/**
		 * @template T
		 * @param {T[]} arr
		 * @returns {T[]}
		 */
		function moveEls(arr) {
			let lm = arr.shift();
			return lm ? [...arr, lm] : arr;
		}

		/**
		 * @returns {Promise<{from: IRegionCords, to: IRegionCords}>}
		 */
		async function findFreePlace() {
			let center = { x: 0, z: 0 };
			let tries = 0;
			let from;
			let to;
			const visited = [];
			/** @type {"x" | "z"} */
			let xORz = "x";
			let x = 1;
			let z = -1;

			while (!from) {
				if (tries >= 10) await sleep(10), (tries = 0);

				const reg = regs.find((e) => e.x === center.x && e.z === center.z);

				if (reg) {
					Log("§cBL:§f " + center.x + " " + center.z);
					visited.push(center.x + " " + center.z);
					if (xORz === "x") {
						xORz = "z";
						z = -z;
					} else {
						xORz = "x";
						x = -x;
					}
					center = moveCenter(
						center,
						xORz === "x" ? x : 0,
						xORz === "z" ? z : 0
					);
				} else {
					from = { x: center.x - size2, z: center.z - size2 };
					to = { x: center.x + size2, z: center.z + size2 };
					break;
				}
			}
			await sleep(20);
			return { from, to };
		}

		let c = 0;
		while (c < 5) {
			c++;
			const reg = await findFreePlace();
			const center = { x: reg.from.x + size2, z: reg.from.z + size2 };
			Log(`x: ${center.x}, z: ${center.z}`);
			XA.o
				.getBlock(new BlockLocation(center.x, -60, center.z))
				.setType(MinecraftBlockTypes.amethystBlock);
			regs.push(center);
		}
	},
	4: async () => XA.o.runCommandAsync("fill -10 -60 -10 10 -60 10 air"),
};

const c = new XA.Command({
	name: "test",
});

c.int("number").executes(async (ctx, n) => {
	const res = tests[n](ctx);
	if (res && typeof res?.catch === "function")
		res.catch((w) =>
			ThrowError({
				message: w?.message ?? w,
				stack: w?.stack ?? new Error().stack,
				name: w?.name ?? "CommandError",
			})
		);
});

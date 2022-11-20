import { BlockLocation, MinecraftBlockTypes } from "@minecraft/server";
import { Log, sleep, ThrowError, toStr, XA } from "xapi.js";
import { CommandCallback } from "../../lib/Command/Callback.js";
import { ModalForm } from "../../lib/Form/Models/ModelForm.js";

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
	3: async () => {
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
			const lm = arr.shift();
			return undefined !== lm ? [...arr, lm] : arr;
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
			let x = [-1, 0, 1, 0];
			let z = [0, -1, 0, 1];

			while (!from) {
				tries++;
				if (tries >= 20) await sleep(1), (tries = 0);

				const reg = regs.find((e) => e.x === center.x && e.z === center.z);

				if (reg) {
					const nextCenter = moveCenter(center, x[1], z[1]);
					if (!visited.includes(nextCenter.x + " " + nextCenter.z)) {
						x = moveEls(x);
						z = moveEls(z);
					}

					center = moveCenter(center, x[0], z[0]);
					visited.push(center.x + " " + center.z);
				} else {
					from = { x: center.x - size2, z: center.z - size2 };
					to = { x: center.x + size2, z: center.z + size2 };
					break;
				}
			}

			return { from, to };
		}

		let c = 0;
		while (c < 100) {
			c++;
			const reg = await findFreePlace();
			await sleep(5);
			if (!reg.from) continue;
			const center = { x: reg.from.x + size2, z: reg.from.z + size2 };
			XA.o
				.getBlock(new BlockLocation(center.x, -60, center.z))
				.setType(MinecraftBlockTypes.amethystBlock);
			regs.push(center);
		}
	},
	4: async () => XA.o.runCommandAsync("fill -10 -60 -10 10 -60 10 air"),
	5: async (ctx) => {
		let form = new ModalForm("TITLE");

		for (let c = 0; c < 20; c++)
			form.addToggle("Опция\n\n§7Описание описание описание\n \n \n ", false);

		await form.show(ctx.sender, (ctx, ...values) => {
			Log("ee");
			// @ts-expect-error
			if (values[0]) ctx.error("ER");
			Log(toStr(values));
		});
	},
};

const c = new XA.Command({
	name: "test",
});

c.int("number", true).executes(async (ctx, n) => {
	const i = n ? n : Object.keys(tests).pop();
	const res = tests[i](ctx);
	if (res && typeof res?.catch === "function")
		res.catch((w) =>
			ThrowError({
				message: w?.message ?? w,
				stack: w?.stack ?? new Error().stack,
				name: w?.name ?? "CommandError",
			})
		);
});

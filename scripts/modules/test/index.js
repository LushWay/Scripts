import { BlockLocation, MinecraftBlockTypes, system, world } from "@minecraft/server";
import { handler, setPlayerInterval, setRole, setTickTimeout, sleep, ThrowError, toStr, XA } from "xapi.js";
import { benchmark } from "../../lib/Benchmark.js";
import { CommandCallback } from "../../lib/Command/Callback.js";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { MessageForm } from "../../lib/Form/MessageForm.js";
import { ModalForm } from "../../lib/Form/ModelForm.js";

/**
 * @type {Object<string, (ctx?: CommandCallback) => void | Promise>}
 */
const tests = {
	1: (ctx) => {
		const menu = new ActionForm("Action", "body").addButton("button", null, () => {
			new ModalForm("ModalForm")
				.addDropdown("drdown", ["op", "op2"])
				.addSlider("slider", 0, 5, 1)
				.addTextField("textField", "placeholder", "defval")
				.addToggle("toggle", false)
				.show(ctx.sender, () => {
					new MessageForm("MessageForm", "body")
						.setButton1("b1", () => void 0)
						.setButton2("b2", () => void 0)
						.show(ctx.sender);
				});
		});
		menu.show(ctx.sender);
	},
	2: (ctx) => {
		setRole(ctx.sender, "admin");
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

		const size = 2; // size
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
			XA.dimensions.overworld
				.getBlock(new BlockLocation(center.x, -60, center.z))
				.setType(MinecraftBlockTypes.amethystBlock);
			regs.push(center);
		}
	},
	4: async () => XA.dimensions.overworld.runCommandAsync("fill -10 -60 -10 10 -60 10 air"),
	5: async (ctx) => {
		let form = new ModalForm("TITLE");

		for (let c = 0; c < 20; c++) form.addToggle("Опция\n\n§7Описание описание описание\n \n \n ", false);

		await form.show(ctx.sender, (ctx, ...values) => {
			world.say("ee");
			// @ts-expect-error
			if (values[0]) ctx.error("ER");
			world.say(toStr(values));
		});
	},
	6: (ctx) => {
		world.scoreboard.getObjectives().forEach((e) => world.scoreboard.removeObjective(e));
	},
	7: (ctx) => {
		world.say(toStr({ ...XA.Entity.getHeldItem(ctx.sender), obj: { str: "string", symbol: Symbol("desc") } }));
	},
	8: () => {
		throw new Error("ERR");
	},
	9: (ctx) => {
		const form = new ActionForm("Like this", "Logs will be showed there");
		form.addButton("Exit", null, (ctx) => {
			ctx;
		});
		form.show(ctx.sender);
	},
	10: (ctx) => {
		let e = 1;

		const r = () => {
			e++;
			if (e > 10) {
				handler(tests[11]);
			} else {
				world.say(e + "");
				system.run(r);
			}
		};
		system.run(r);
	},
	11: () => {
		throw new Error("m");
	},
	12: () => {
		setTickTimeout(tests[11]);
	},
	13: (ctx) => {
		ctx.reply(toStr(ctx.sender.getComponents()));
	},
	14: () => {
		world.say(bigdata.length + "");
		done = true;
	},
	16: async (ctx) => {
		if (!bigdata) {
			for (let i = 0; i < 42949672; i++) {
				if (done) break;
				if (i % 10000 === 0) {
					world.say(i + "");
					await sleep(1);
				}
				bigdata += "1";
			}
			ctx.reply("String generated");
		}

		for (let i = 0; i < 1000; i++) {
			if (i % 5 === 0) await sleep(1);
			const end1 = benchmark("SetMaxValueSpeed");
			world.setDynamicProperty("speed_test", bigdata);
			end1();
		}
		ctx.reply("Set test done");

		let e = 0;

		for (let i = 0; i < 1000; i++) {
			if (i % 5 === 0) await sleep(1);
			const end1 = benchmark("GetMaxValueSpeed");
			const data = world.getDynamicProperty("speed_test");
			if (!e) {
				e = 1;
				if (typeof data === "string") world.say(`${data.length}  ${data === bigdata}`);
			}
			end1();
		}
		ctx.reply("Get test done");
	},
	17: (ctx) => {
		const end = benchmark("PROP");
		const prop = world.getDynamicProperty("speed_test");
		if (typeof prop === "string") ctx.reply(prop.length);
		end();
	},
};
let bigdata = "";
let done = false;

const c = new XA.Command({
	name: "test",
});

c.int("number", true).executes(async (ctx, n) => {
	const keys = Object.keys(tests);
	const i = n && keys.includes(n + "") ? n : keys.pop();
	ctx.reply(i);
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

setPlayerInterval((_) => {
	_.getComponents();
});

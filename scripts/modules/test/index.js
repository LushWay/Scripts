import { BlockLocation, Location, MinecraftBlockTypes, MolangVariableMap, system, world } from "@minecraft/server";
import { handle, IS, setRole, setTickTimeout, sleep, ThrowError, toStr, XA } from "xapi.js";
import { benchmark } from "../../lib/Benchmark.js";
import { stackParse } from "../../lib/Class/Error.js";
import { CommandContext } from "../../lib/Command/Callback.js";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { MessageForm } from "../../lib/Form/MessageForm.js";
import { ModalForm } from "../../lib/Form/ModelForm.js";
import { Region } from "../Region/utils/Region.js";
import { Cuboid } from "../World Edit/modules/utils/Cuboid.js";

/**
 * @typedef {{x: number, z: number}} IRegionCords
 */

/** @type {[IRegionCords, IRegionCords][]} */
const regs = [];

/**
 * @type {Object<string, (ctx?: CommandContext) => void | Promise>}
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
		const size = 30; // size
		const size2 = size / 2 - 1;

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
		 * Compare a array of numbers with 2 arrays
		 * @param {[number, number, number]} XYZa  The first set of numbers
		 * @param {[number, number, number]} XYZb  The second set of numbers
		 * @param {[number, number, number]} XYZc  The set of numbers that should between the first and second set of numbers
		 * @example betweenXYZ([1, 0, 1], [22, 81, 10], [19, 40, 6]));
		 * @returns {boolean}
		 */
		function betweenXYZ(XYZa, XYZb, XYZc) {
			return XYZc.every((c, i) => c >= Math.min(XYZa[i], XYZb[i]) && c <= Math.max(XYZa[i], XYZb[i]));
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

				const alreadyExist = regs.find((e) =>
					betweenXYZ([e[0].x, 1, e[0].z], [e[1].x, -1, e[1].z], [center.x, 0, center.z])
				);

				if (alreadyExist) {
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

		const reg = await findFreePlace();
		const set = (pos) =>
			XA.dimensions.overworld.getBlock(new BlockLocation(pos.x, -60, pos.z)).setType(MinecraftBlockTypes.bedrock);

		set(reg.from);
		set(reg.to);
		regs.push([reg.from, reg.to]);
	},
	5: async (ctx) => {
		let form = new ModalForm("TITLE");

		for (let c = 0; c < 20; c++) form.addToggle("Опция\n\n§7Описание описание описание\n \n \n ", false);

		await form.show(ctx.sender, (ctx, ...values) => {
			world.say("ee");
			// @ts-expect-errorf0993d58-5734-43ee-9008-8546337c6785
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
				handle(tests[11]);
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
		setTickTimeout(tests[11], 0, "test");
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
	18: (ctx) => {
		const region = Region.blockLocationInRegion(
			XA.Utils.vecToBlockLocation(ctx.sender.location),
			ctx.sender.dimension.id
		);
		region.permissions.owners = region.permissions.owners.filter((e) => e !== ctx.sender.id);
		region.update();
	},
	19: (ctx) => {
		console.warn("WARN");
	},
	20: async () => {
		ThrowError(new ReferenceError("Test reference error"));
		try {
			await XA.dimensions.overworld.runCommandAsync("EEEEEE");
		} catch (e) {
			ThrowError(e);
		}
		XA.runCommandX("TEST", { showError: true });
		ThrowError(new TypeError("ADDITION_STACK_TEST"), 0, ["stack1", "stack2"]);
	},
	21: (ctx) => {
		for (let a of [1000, 1000 * 60, 1000 * 60 * 60, 1000 * 60 * 60 * 60, 1000 * 60 * 60 * 60 * 24]) {
			const date = new Date();
			ctx.reply(a);
			date.setTime(a);
			ctx.reply(
				"Date: " +
					date.getDate() +
					" " +
					(date.getTime() / (1000 * 60 * 60 * 60 * 24)).toFixed(2) +
					" " +
					date.getHours() +
					"hh" +
					date.getMinutes() +
					"mm" +
					date.getSeconds() +
					"ss " +
					date.getMilliseconds() +
					"ms"
			);
		}
	},
	26(ctx) {
		const pos1 = XA.Utils.vecToBlockLocation(ctx.sender.location);
		const pos2 = pos1.offset(3, 3, 3);
		const cube = new Cuboid(pos1, pos2);
		const { xCenter, xMax, xMin, zCenter, zMax, zMin, yCenter, yMax, yMin } = cube;
		const end1 = benchmark("safeBlocksForOF");
		for (const { x, y, z } of XA.Utils.safeBlocksBetween(pos1, pos2, false)) {
			const q =
				((x == xMin || x == xMax) && (y == yMin || y == yMax)) ||
				((y == yMin || y == yMax) && (z == zMin || z == zMax)) ||
				((z == zMin || z == zMax) && (x == xMin || x == xMax));

			if (q) ctx.sender.dimension.spawnParticle("minecraft:endrod", new Location(x, y, z), new MolangVariableMap());
		}
		end1();
		const end2 = benchmark("safeBlocksWhile");
		const gen = XA.Utils.safeBlocksBetween(pos1, pos2, false);
		let val;
		while (!val?.done) {
			val = gen.next();
			if (!val.value) continue;
			const { x, y, z } = val.value;
			const q =
				((x == xMin || x == xMax) && (y == yMin || y == yMax)) ||
				((y == yMin || y == yMax) && (z == zMin || z == zMax)) ||
				((z == zMin || z == zMax) && (x == xMin || x == xMax));

			if (q) ctx.sender.dimension.spawnParticle("minecraft:endrod", new Location(x, y, z), new MolangVariableMap());
		}
		end2();
	},
	27(ctx) {
		system.run(() => {
			world.say(stackParse());
		});
	},
};
let bigdata = "";
let done = false;

const c = new XA.Command({
	name: "test",
	requires: (p) => IS(p.id, "admin"),
});

c.string("number", true).executes(async (ctx, n) => {
	const keys = Object.keys(tests);
	const i = n && keys.includes(n) ? n : keys.pop();
	ctx.reply(i);
	handle(() => tests[i](ctx), "Test");
});

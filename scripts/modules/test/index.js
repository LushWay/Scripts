import {
	EquipmentSlot,
	MinecraftEnchantmentTypes,
	system,
	Vector,
	world,
} from "@minecraft/server";
import { DisplayError, handle, toStr, XA } from "xapi.js";
import { benchmark } from "../../lib/Class/XBenchmark.js";
import { stackParse } from "../../lib/Class/XError.js";
import { CommandContext } from "../../lib/Command/Context.js";
import { Database } from "../../lib/Database/Rubedo.js";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { MessageForm } from "../../lib/Form/MessageForm.js";
import { ModalForm } from "../../lib/Form/ModelForm.js";
import { CustomEnchantments } from "../Enchantments/var.js";
import { Region } from "../Region/Region.js";
import { SERVER } from "../Server/var.js";
import "./commands/import.js";

/**
 * @typedef {{x: number, z: number}} IRegionCords
 */

/**
 * @type {Object<string, (ctx?: CommandContext) => void | Promise<any>>}
 */
const tests = {
	1: (ctx) => {
		const menu = new ActionForm("Action", "body").addButton(
			"button",
			null,
			() => {
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
			}
		);
		menu.show(ctx.sender);
	},
	8: () => {
		throw new Error("ERR");
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
					await system.sleep(1);
				}
				bigdata += "1";
			}
			ctx.reply("String generated");
		}

		for (let i = 0; i < 1000; i++) {
			if (i % 5 === 0) await system.sleep(1);
			const end1 = benchmark("SetMaxValueSpeed");
			world.setDynamicProperty("speed_test", bigdata);
			end1();
		}
		ctx.reply("Set test done");

		let e = 0;

		for (let i = 0; i < 1000; i++) {
			if (i % 5 === 0) await system.sleep(1);
			const end1 = benchmark("GetMaxValueSpeed");
			const data = world.getDynamicProperty("speed_test");
			if (!e) {
				e = 1;
				if (typeof data === "string")
					world.say(`${data.length}  ${data === bigdata}`);
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
			Vector.floor(ctx.sender.location),
			ctx.sender.dimension.id
		);
		region.permissions.owners = region.permissions.owners.filter(
			(e) => e !== ctx.sender.id
		);
		region.update();
	},
	20: async () => {
		DisplayError(new ReferenceError("Test reference error"));
		try {
			await world.overworld.runCommandAsync("EEEEEE");
		} catch (e) {
			DisplayError(e);
		}
		XA.runCommandX("TEST", { showError: true });
		DisplayError(new TypeError("ADDITION_STACK_TEST"), 0, ["stack1", "stack2"]);
	},
	21: (ctx) => {
		for (let a of [
			1000,
			1000 * 60,
			1000 * 60 * 60,
			1000 * 60 * 60 * 60,
			1000 * 60 * 60 * 60 * 24,
		]) {
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
	27(ctx) {
		system.run(() => {
			world.say(stackParse());
		});
	},
	async 28(ctx) {
		for (const player of world.getPlayers()) {
			async function run() {
				const block = await XA.Utils.selectBlock(player);
				world.say(toStr(block));
			}
			run();
		}
	},
	30(ctx) {
		const pos1 = Vector.floor(ctx.sender.location);
		const pos2 = Vector.add(pos1, Vector.down);
		const block = ctx.sender.dimension.getBlock(pos2);

		world.debug(block.getTags());
		world.debug(block.permutation.getAllProperties());
	},
	31(ctx) {
		const reg = Region.blockLocationInRegion(
			ctx.sender.location,
			ctx.sender.dimension.id
		);
		if (!reg) return ctx.error("No region!");

		reg.permissions.allowedEntitys.push(
			...ctx.args.filter((e) => e.includes(":"))
		);
		reg.update();
	},
	32(ctx) {
		const show = () => {
			new ModalForm("Tet")
				.addTextField(
					text.replace(/\\n/g, "\n") || "input and submit",
					"",
					text
				)
				.show(ctx.sender, (_, text2) => {
					text = text2;
					world.say(text2);
					show();
				});
		};

		show();
	},
	33(ctx) {
		const item = ctx.sender
			.getComponent("inventory")
			.container.getItem(ctx.sender.selectedSlot);

		world.debug([...item.getComponent("enchantments").enchantments]);

		const nitem = ctx.sender
			.getComponent("inventory")
			.container.getItem(ctx.sender.selectedSlot + 1);

		nitem.getComponent("enchantments").enchantments =
			nitem.getComponent("enchantments").enchantments;

		world.debug([...nitem.getComponent("enchantments").enchantments]);
	},
	34(ctx) {
		world.debug(XA.Lang.emoji);
	},
	35(ctx) {
		/**
		 *
		 * @param {Vector3} a
		 * @param {Vector3} b
		 * @returns
		 */
		const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

		/**
		 * Checks if a vector is between two other vectors.
		 * @param {Vector3} a - The vector to check.
		 * @param {Vector3} b - The first vector to compare against.
		 * @param {Vector3} c - The second vector to compare against.
		 * @returns {boolean} Whether or not the vector is between the two other vectors.
		 */
		function between(a, b, c) {
			return (
				c.x >= (a.x < b.x ? a.x : b.x) &&
				c.x <= (a.x > b.x ? a.x : b.x) &&
				c.y >= (a.y < b.y ? a.y : b.y) &&
				c.y <= (a.y > b.y ? a.y : b.y) &&
				c.z >= (a.z < b.z ? a.z : b.z) &&
				c.z <= (a.z > b.z ? a.z : b.z)
			);
		}
		Vector.between = between;

		world.debug([
			Vector.between(
				new Vector(1, 1, 1),
				new Vector(4, 4, 4),
				new Vector(3, 2, 2)
			) === true,

			Vector.between(
				new Vector(1, 1, 1),
				new Vector(4, 4, 4),
				new Vector(3, 2, 1)
			) === true,

			Vector.between(
				new Vector(1, 1, 1),
				new Vector(4, 4, 4),
				new Vector(3, 32, 5)
			) === false,

			Vector.between(
				new Vector(1, 1, 1),
				new Vector(4, 4, 4),
				new Vector(3, 2, 5)
			) === false,
		]);
	},
	36(ctx) {
		world.debug(Database.tables[ctx.args[0]]._);
		world.debug(Region.getAllRegions());
	},
	37(ctx) {
		const entity = world.overworld.spawnEntity("x:loot", ctx.sender.location);
		entity.nameTag = ctx.sender.name;
	},
	38(ctx) {
		const mainhand = ctx.sender
			.getComponent("equipment_inventory")
			.getEquipmentSlot(EquipmentSlot.mainhand);

		const item = mainhand.getItem();
		const { enchantments } = item.getComponent("enchantments");
		enchantments.removeEnchantment(MinecraftEnchantmentTypes.sharpness);
		enchantments.addEnchantment(
			CustomEnchantments[MinecraftEnchantmentTypes.sharpness.id][10]
		);

		mainhand.setItem(item);
	},
	39(ctx) {
		world.debug("type ", SERVER.options.type);
	},
};

let text = "";
let bigdata = "";
let done = false;

const c = new XA.Command({
	name: "test",
	role: "admin",
});

c.string("number", true).executes(async (ctx, n) => {
	const keys = Object.keys(tests);
	const i = n && keys.includes(n) ? n : keys.pop();
	ctx.reply(i);
	handle(() => tests[i](ctx), "Test");
});

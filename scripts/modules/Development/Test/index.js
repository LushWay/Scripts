import {
	ItemStack,
	MinecraftItemTypes,
	MolangVariableMap,
	Player,
	Vector,
	system,
	world,
} from "@minecraft/server";
import "lib/Class/Net.js";
import { CommandContext } from "lib/Command/Context.js";
import { ActionForm } from "lib/Form/ActionForm.js";
import { MessageForm } from "lib/Form/MessageForm.js";
import { ModalForm } from "lib/Form/ModelForm.js";
import { DB, GameUtils, XEntity, util } from "xapi.js";
import { APIRequest } from "../../../lib/Class/Net.js";
import "./enchant.js";

world.afterEvents.chatSend.subscribe((event) => {
	console.info(event.sender.name + ": " + event.message);
});

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
	13: (ctx) => {
		ctx.reply(util.inspect(ctx.sender.getComponents()));
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

	41(ctx) {
		world.debug(
			"test41",
			{ DB },
			world.overworld.getEntities({ type: DB.ENTITY_IDENTIFIER }).map((e) => {
				const { nameTag, location } = e;
				const type = e.getDynamicProperty("tableType");
				let data = "";
				const a = e.getComponent("inventory").container;
				for (let i = 0; i < 2; i++) {
					if (a.getItem(i)) data += a.getItem(i).getLore().join("");
				}

				return {
					nameTag,
					location,
					table: e.getDynamicProperty("tableName"),
					type,
					index: e.getDynamicProperty("index"),
					data,
				};
			})
		);
	},
	45(ctx) {
		const i = MinecraftItemTypes;

		const items = [
			i.acaciaButton,
			i.acaciaStairs,
			i.apple,
			i.bannerPattern,
			i.netheriteAxe,
			i.zombieHorseSpawnEgg,
			i.boat,
			i.chestBoat,
			i.darkOakBoat,
			i.blueWool,
			i.cobblestoneWall,
		];

		for (const item of items) {
			const stack = new ItemStack(item);
			ctx.reply(GameUtils.localizationName(stack));
		}
	},
	48(ctx) {
		const { block } = ctx.sender.getBlockFromViewDirection({
			includeLiquidBlocks: false,
			includePassableBlocks: false,
			maxDistance: 50,
		});

		if (!block) return;

		// falling_dust explosion_particle explosion_manual glow_particle sparkler_emitter wax_particle

		const variables = new MolangVariableMap().setColorRGB("color", {
			red: 1,
			green: 1,
			blue: 1,
			alpha: 0,
		});

		let c = 0;
		const id = system.runInterval(
			() => {
				c++;
				block.dimension.spawnParticle(
					"minecraft:colored_flame_particle",
					Vector.add(block.location, { x: 0.5, z: 0.5, y: 1.5 }),
					variables
				);

				if (c >= 6) system.clearRun(id);
			},
			"test",
			10
		);
	},
	50(ctx) {
		const nums = ctx.args.map(Number);
		const full = nums[1] ?? 10;
		const current = nums[2] ?? 5;
		const damage = nums[3] ?? 0;
		let bar = "";
		for (let i = 1; i <= full; i++) {
			if (i <= current) bar += "§c/";
			if (i > current && i <= current + damage) bar += "§e/";
			if (i > current + damage) bar += "§7/";
		}

		ctx.reply(bar);
	},
	async 51(ctx) {
		const res = await APIRequest("playerPlatform", {
			playerName: ctx.sender.name,
		});

		console.warn(util.inspect(res));
	},
};

console.log("This is log §6color§r test §lbold");
console.info("This is info test");
util.error(new TypeError("This is error test"));

world.afterEvents.entityHitEntity.subscribe((event) => {
	if (event.damagingEntity instanceof Player) {
		const axe = XEntity.getHeldItem(event.damagingEntity);
		if (axe && !axe.typeId.includes("axe")) return;

		event.damagingEntity.startItemCooldown("axe", 10);
	}
});

// const i = MinecraftItemTypes;
// new Store({ x: -180, y: 69, z: -144 }, "minecraft:overworld", {
// 	prompt: true,
// })
// 	.addItem(new ItemStack(i.chest, 5), new MoneyCost(30))
// 	.addItem(new ItemStack(i.boat), new MoneyCost(10))
// 	.addItem(new ItemStack(i.apple), new MoneyCost(1));

const c = new XCommand({
	name: "test",
	role: "admin",
});

c.string("number", true).executes(async (ctx, n) => {
	const keys = Object.keys(tests);
	const i = n && keys.includes(n) ? n : keys.pop();
	ctx.reply(i);
	util.handle(() => tests[i](ctx), "Test");
});

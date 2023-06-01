import {
	ItemStack,
	MinecraftItemTypes,
	MolangVariableMap,
	Player,
	Vector,
	system,
	world,
} from "@minecraft/server";
import { fetch } from "lib/Class/Net.js";
import { CommandContext } from "lib/Command/Context.js";
import { ActionForm } from "lib/Form/ActionForm.js";
import { MessageForm } from "lib/Form/MessageForm.js";
import { ModalForm } from "lib/Form/ModelForm.js";
import { DB, GameUtils, InventoryStore, XEntity, util } from "xapi.js";
import { randomTeleport } from "../../Gameplay/Survival/rtp.js";
import "./enchant.js";

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

	40(ctx) {
		if (ctx.args[1] === "in") {
			AnarchyInventory.saveFromEntity(ctx.sender);
			InventoryStore.load(ctx.sender, {
				xp: 0,
				health: 10,
				equipment: {},
				slots: [new ItemStack("xa:menu")],
			});
		} else {
			InventoryStore.load(
				ctx.sender,
				AnarchyInventory.getEntityStore(ctx.sender.id)
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

	43(ctx) {
		const loc = randomTeleport(
			ctx.sender,
			{ x: 0, y: 0, z: 0 },
			{ x: 500, y: 0, z: 500 },
			{ elytra: true, keepInSkyTime: 8 }
		);
		ctx.sender.tell(`Вы были перемещены на ${Vector.string(loc)}. `);
		let count = 8;
		const id = system.runInterval(
			() => {
				count--;
				if (count) {
					ctx.sender.onScreenDisplay.setActionBar(
						`   Вы полетите через ${count}\nНе забудьте открыть элитры!`
					);
					ctx.sender.playSound("note.pling", {
						pitch: 1 - count / 8,
					});
				} else {
					ctx.sender.playSound("note.pling");
					ctx.sender.onScreenDisplay.setActionBar(`Мягкой посадки!`);
					system.clearRun(id);
				}
			},
			"testasd",
			20
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
		const block = ctx.sender.getBlockFromViewDirection({
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
		const res = await fetch("index", { data: true });
		console.warn(util.inspect(res, " ").replace(/§./g, ""));
	},
};

world.afterEvents.entityHit.subscribe((data) => {
	if (data.entity instanceof Player) {
		const axe = XEntity.getHeldItem(data.entity);
		if (axe && !axe.typeId.includes("axe")) return;

		data.entity.startItemCooldown("axe", 10);
	}
});

// const i = MinecraftItemTypes;
// new Store({ x: -180, y: 69, z: -144 }, "minecraft:overworld", {
// 	prompt: true,
// })
// 	.addItem(new ItemStack(i.chest, 5), new MoneyCost(30))
// 	.addItem(new ItemStack(i.boat), new MoneyCost(10))
// 	.addItem(new ItemStack(i.apple), new MoneyCost(1));

const AnarchyInventory = new InventoryStore("anarchy");

system.runInterval(
	() => {
		const player = world.overworld.getPlayers({
			maxDistance: 1,
			location: { x: -2, y: 191, z: 4 },
		})[0];

		if (player) {
			AnarchyInventory.saveFromEntity(player);
			InventoryStore.load(player, {
				xp: 0,
				health: 10,
				equipment: {},
				slots: [new ItemStack("xa:menu")],
			});
			player.teleport({ x: -2, y: 191, z: -1 });
		}

		const player2 = world.overworld.getPlayers({
			location: { x: -2, y: 191, z: 1 },
			maxDistance: 1,
		})[0];

		if (player2) {
			InventoryStore.load(player2, AnarchyInventory.getEntityStore(player2.id));
			player2.teleport({ x: -2, y: 191, z: 6 });
		}
	},
	"a",
	10
);

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

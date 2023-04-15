import { ItemStack, Items, Vector, system, world } from "@minecraft/server";
import { CommandContext } from "lib/Command/Context.js";
import { ActionForm } from "lib/Form/ActionForm.js";
import { MessageForm } from "lib/Form/MessageForm.js";
import { ModalForm } from "lib/Form/ModelForm.js";
import { XA, handle, toStr } from "xapi.js";
import { DB } from "../../../lib/Database/Default.js";
import { InventoryStore } from "../../../lib/Database/Inventory.js";
import { Region } from "../../Server/Region/Region.js";
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
		ctx.reply(toStr(ctx.sender.getComponents()));
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

	40(ctx) {
		if (ctx.args[1] === "in") {
			Store.saveFromEntity(ctx.sender);
			InventoryStore.load(ctx.sender, {
				xp: 0,
				health: 10,
				equipment: {},
				slots: [new ItemStack(Items.get("xa:menu"))],
			});
		} else {
			InventoryStore.load(ctx.sender, Store.getEntityStore(ctx.sender.id));
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
};

const Store = new InventoryStore("anarchy");

system.runInterval(
	() => {
		const player = world.overworld.getPlayers({
			maxDistance: 1,
			location: { x: -2, y: 191, z: 4 },
		})[0];

		if (player) {
			Store.saveFromEntity(player);
			InventoryStore.load(player, {
				xp: 0,
				health: 10,
				equipment: {},
				slots: [new ItemStack(Items.get("xa:menu"))],
			});
			player.teleport({ x: -2, y: 191, z: -1 });
		}

		const player2 = world.overworld.getPlayers({
			location: { x: -2, y: 191, z: 1 },
			maxDistance: 1,
		})[0];

		if (player2) {
			InventoryStore.load(player2, Store.getEntityStore(player2.id));
			player2.teleport({ x: -2, y: 191, z: 6 });
		}
	},
	"a",
	10
);

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

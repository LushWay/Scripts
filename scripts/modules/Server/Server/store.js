import { ItemStack, Player, world } from "@minecraft/server";
import { ActionForm, EventSignal, GameUtils, MessageForm } from "xapi.js";
import { SERVER } from "./var.js";

class Cost {
	/**
	 * Returns string representation of cost
	 * @returns {string}
	 */
	string(canBuy = true) {
		return "";
	}
	/**
	 * If the player have this cost returns true, otherwise false
	 * @param {Player} player
	 * @returns {boolean}
	 */
	check(player) {
		return false;
	}
	/**
	 * Removes this cost from player
	 * @param {Player} player
	 */
	buy(player) {
		player.playSound("random.orb");
	}
	/**
	 * Returns fail info for player
	 * @param {Player} player
	 * @returns {string}
	 */
	failed(player) {
		player.playSound("random.anvil_land");
		return "Недостаточно средств";
	}
}

export class MoneyCost extends Cost {
	constructor(money = 1) {
		super();
		this.money = money;
	}
	string(canBuy = true) {
		return `${canBuy ? "§6" : "§c"}${this.money}M`;
	}
	/**
	 * @param {Player} player
	 */
	check(player) {
		const money = SERVER.money.get(player);
		return money >= this.money;
	}

	/**
	 * @param {Player} player
	 */
	buy(player) {
		SERVER.money.add(player, -this.money);
		super.buy(player);
	}

	/**
	 * @param {Player} player
	 */
	failed(player) {
		super.failed(player);
		const money = SERVER.money.get(player);
		return `§cНедостаточно средств (§4${money}/${this.money}§c). Нужно еще §6${
			//§r
			this.money - money
		}`;
	}
}

class ItemCost extends Cost {}

/**
 * @typedef {object} StoreOptions
 * @prop {string} title - Title of the store form.
 * @prop {(p: Player) => string} body - Body of the store form.
 * @prop {boolean} prompt - Whenever ask user before buy or not.
 */

export class Store {
	/**
	 * @type {Store[]}
	 */
	static STORES = [];

	/**
	 *
	 * @param {Vector3} location
	 * @param {Dimensions} dimensionId
	 */
	static find(location, dimensionId) {
		return this.STORES.find(
			(e) =>
				e.dimensionId === dimensionId &&
				e.location.x === location.x &&
				e.location.y === location.y &&
				e.location.z === location.z
		);
	}

	/**
	 * @type {Array<{cost: Cost, item: ItemStack}>}
	 */
	items = [];

	#EVENTS = {
		/** @type {EventSignal<Player>} */
		open: new EventSignal(),

		/** @type {EventSignal<Player>} */
		buy: new EventSignal(),

		/** @type {EventSignal<Player>} */
		beforeBuy: new EventSignal(),
	};

	events = {
		open: this.#EVENTS.open,
		buy: this.#EVENTS.buy,
		beforeBuy: this.#EVENTS.beforeBuy,
	};

	/**
	 *
	 * @param {Vector3} location
	 * @param {Dimensions} dimensionId
	 * @param {Partial<StoreOptions>} [options]
	 * @param {Store["items"]} [items]
	 */
	constructor(location, dimensionId, options, items = []) {
		this.location = location;
		this.dimensionId = dimensionId;
		this.items = [];
		/** @type {StoreOptions} */
		this.options = {
			title: "Купить",
			body: (p) =>
				`${
					this.options.prompt
						? "Подтверждение перед покупкой §aесть."
						: "Подтверждения перед покупкой §cнет."
				}\n§fБаланс: §6${SERVER.money.get(p)}M`,
			prompt: true,
			...options,
		};

		Store.STORES.push(this);
	}

	/**
	 * Adds item to menu
	 * @param {ItemStack} item
	 * @param {Cost} cost
	 */
	addItem(item, cost) {
		this.items.push({ item, cost });
		return this;
	}
	/**
	 *
	 * @param {{cost: Cost, item: ItemStack, player: Player}} data
	 */
	buy({ item, cost, player }) {
		if (!cost.check(player)) {
			return this.open(player, `${cost.failed(player)}§r\n \n`);
		}

		const finalBuy = () => {
			if (!cost.check(player)) {
				return this.open(player, `${cost.failed(player)}§r\n \n`);
			}
			cost.buy(player);
			player.getComponent("inventory").container.addItem(item);
			this.open(
				player,
				`§aУспешная покупка §f${itemDescription(
					item
				)} §aза ${cost.string()}§a!\n \n§r`
			);
		};

		if (this.options.prompt) {
			new MessageForm(
				"Подтверждение",
				`§fКупить ${itemDescription(item)} §fза ${cost.string()}?`
			)
				.setButton1("§aКупить!", finalBuy)
				.setButton2("§cОтмена", () =>
					this.open(player, "§cПокупка отменена§r\n \n")
				) // §r
				.show(player);
		} else finalBuy();
	}
	/**
	 * Opens store menu to player
	 * @param {Player} player
	 */
	open(player, message = "") {
		const form = new ActionForm(
			this.options.title,
			message + this.options.body(player)
		);
		for (const { item, cost } of this.items) {
			const canBuy = cost.check(player);
			form.addButton(
				`${canBuy ? "" : "§7"}${itemDescription(
					item,
					canBuy ? "§g" : "§7"
				)}\n${cost.string(canBuy)}`,
				null,
				() => this.buy({ item, cost, player })
			);
		}

		form.show(player);
	}
}

/**
 * Returns <item name> x<count>
 * @param {ItemStack} item
 */
function itemDescription(item, c = "§g") {
	return `${item.nameTag ?? GameUtils.localizationName(item)}§r${
		item.amount ? ` ${c}x${item.amount}` : ""
	}`;
}

world.afterEvents.entityHitBlock.subscribe((event) => {
	const store = Store.find(
		event.hitBlock.location,
		event.hitBlock.dimension.type
	);

	if (!store || !(event.damagingEntity instanceof Player)) return;

	store.open(event.damagingEntity);
});

/**
 *
 * @template {Object} F
 * @param {F} from
 * @template {keyof F} T
 * @param {T} name
 */
function listen(from, name) {
	// @ts-expect-error
	from[name].subscribe(() => {
		console.log(name);
	});
}

// listen(world.afterEvents, "entityHitBlock");
// listen(world.afterEvents, "targetBlockHit");
// listen(world.beforeEvents, "itemUse");
// listen(world.beforeEvents, "itemUseOn");

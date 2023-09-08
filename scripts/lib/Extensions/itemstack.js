import { ItemStack } from "@minecraft/server";

Object.defineProperties(ItemStack.prototype, {
	enchantments: {
		get() {
			return this.getComponent("enchantments");
		},
		configurable: false,
		enumerable: true,
	},
	food: {
		get() {
			return this.getComponent("food");
		},
		configurable: false,
		enumerable: true,
	},
	durability: {
		get() {
			return this.getComponent("durability");
		},
		configurable: false,
		enumerable: true,
	},
	cooldown: {
		get() {
			return this.getComponent("cooldown");
		},
		configurable: false,
		enumerable: true,
	},
});

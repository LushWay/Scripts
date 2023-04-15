import {
	ItemStack,
	MinecraftItemTypes,
	Player,
	system,
	world,
} from "@minecraft/server";
import { Enchantments } from "../Enchantments/index.js";

const RTP_ELYTRA = new ItemStack(MinecraftItemTypes.elytra, 1);
const lore = ["§r§7Элитра перелета, пропадает на земле"];
RTP_ELYTRA.setLore(lore);
RTP_ELYTRA.nameTag = "§6Элитра перемещения";

Enchantments.events.onLoad.subscribe(() => {
	const enchantments = RTP_ELYTRA.getComponent("enchantments");
	enchantments.enchantments.addEnchantment(Enchantments.Typed.unbreaking[10]);
});

/**
 *
 * @param {Player} target
 * @param {Vector3} from
 * @param {Vector3} to
 * @param {object} options
 * @param {number} [options.y]
 */
export function RandomTeleport(target, from, to, { y = 200 }) {}

system.runInterval(
	() => {
		const groundPlayers = world.getPlayers({ tags: ["on_ground"] });

		for (const player of groundPlayers) {
		}
	},
	"clear rtp elytra",
	20
);

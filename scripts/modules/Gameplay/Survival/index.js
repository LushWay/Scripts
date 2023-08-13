import { MinecraftBlockTypes, Vector, system, world } from "@minecraft/server";
import { MinecraftEffectTypes } from "../../../lib/List/effects.js";
import {
	EditableLocation,
	InventoryStore,
	Options,
	OverTakes,
	XEntity,
	util,
} from "../../../xapi.js";
import { MENU } from "../../Server/Menu/var.js";
import { JOIN } from "../../Server/OnJoin/var.js";
import { RadiusRegion, Region } from "../../Server/Region/Region.js";
import { loadRegionsWithGuards } from "../../Server/Region/index.js";
import "./base.js";
import { baseItemStack } from "./base.js";
import "./bouncyTnt.js";
import "./fireworks.js";
import { Portal } from "./portals.js";
import "./raid.js";
import { randomTeleport } from "./rtp.js";

loadRegionsWithGuards(
	// Common actions guard
	(player, region, context) => {
		if (region) {
			if (region.permissions.owners.includes(player.id)) return true;
		} else {
			const heldItem = XEntity.getHeldItem(player);
			if (heldItem?.isStackableWith(baseItemStack)) return true;

			if (context.type === "break" && player.isGamemode("adventure"))
				return true;

			if (player.hasTag("modding")) return true;
		}
	},

	// Spawn entity guard
	(region, data) =>
		!region ||
		region.permissions.allowedEntitys === "all" ||
		region.permissions.allowedEntitys.includes(data.entity.typeId),

	(player, block, region) => {
		if (block && block?.type?.id === "minecraft:smithing_table") return true;
		const heldItem = XEntity.getHeldItem(player);
		if (!region && heldItem?.isStackableWith(baseItemStack)) return true;
	}
);

Region.CONFIG.PERMISSIONS = {
	allowedEntitys: "all",
	doorsAndSwitches: false,
	openContainers: false,
	owners: [],
	pvp: true,
};

JOIN.CONFIG.title_animation = {
	stages: ["» $title «", "»  $title  «"],
	vars: {
		title: "§aShp1nat§6Mine§r§f",
	},
};
JOIN.CONFIG.subtitle = "Добро пожаловать!";

const woodBlocks = Object.entries(MinecraftBlockTypes)
	.filter((e) => e[0].match(/log/i))
	.map((e) => e[1].id);

OverTakes(MENU, {
	GetItem(player, anarchy = false) {
		const item = super.GetItem();
		if (anarchy) {
			item.setCanDestroy(woodBlocks);
		}
		return item;
	},
});

JOIN.EVENTS.firstTime.subscribe((player) => {
	player.getComponent("inventory").container.addItem(MENU.GetItem(player));
});

const SpawnInventory = {
	xp: 0,
	health: 20,
	equipment: {},
	slots: [MENU.GetItem()],
};
const SpawnLocation = new EditableLocation("spawn", {
	fallback: new Vector(0, 200, 0),
});
if (SpawnLocation.valid) {
	new Portal("spawn", null, null, (player) => {
		if (!Portal.canTeleport(player)) return;
		/** @type {PlayerDB<DB>} */
		const { save, data } = player.db();

		if (data.inv === "spawn") {
			return player.tell("§cВы уже находитесь на спавне!");
		}

		if (data.inv === "anarchy") {
			AnarchyInventory.saveFromEntity(player);
			data.anarchy = Vector.floor(player.location);
		}

		InventoryStore.load(player, SpawnInventory);
		data.inv = "spawn";
		save();

		player.teleport(SpawnLocation);
	});
	world.setDefaultSpawnLocation(SpawnLocation);
	let spawnregion = Region.locationInRegion(SpawnLocation, "overworld");
	if (!spawnregion || !(spawnregion instanceof RadiusRegion)) {
		spawnregion = new RadiusRegion(SpawnLocation, 200, "overworld", {
			doorsAndSwitches: false,
			openContainers: false,
			pvp: false,
			allowedEntitys: "all",
			owners: [],
		});
	}
	system.runPlayerInterval((player) => {
		if (spawnregion.vectorInRegion(player.location)) {
			/** @type {PlayerDB<DB>} */
			const { save, data } = player.db();
			if (data.inv !== "spawn") {
				if (data.inv === "anarchy") {
					AnarchyInventory.saveFromEntity(player, {
						rewrite: true,
						keepInventory: false,
					});
				}
				InventoryStore.load(player, SpawnInventory);
				data.inv = "spawn";
				save();
			}

			player.addEffect(MinecraftEffectTypes.Saturation, 1, {
				amplifier: 255,
				showParticles: false,
			});
		}
	}, "SpawnRegion");
}

for (const key of Object.keys(JOIN.EVENT_DEFAULTS)) {
	JOIN.EVENTS[key].unsubscribe(JOIN.EVENT_DEFAULTS[key]);
}

const getSettings = Options.player("Телепорт", "Atp", {
	showCoordinates: {
		name: "Показать координаты",
		desc: "Выключите если вы стример",
		value: true,
	},
});

/**
 * @typedef {{anarchy?: Vector3, inv: "anarchy" | "spawn" | "mg"}} DB
 */

const AnarchyInventory = new InventoryStore("anarchy");
const AnarchyPortalLocation = new EditableLocation("anarchy");
if (AnarchyPortalLocation.valid) {
	new Portal(
		"anarchy",
		Vector.add(AnarchyPortalLocation, { x: 0, y: -1, z: -1 }),
		Vector.add(AnarchyPortalLocation, { x: 0, y: 1, z: 1 }),
		(player) => {
			if (!Portal.canTeleport(player)) return;
			/** @type {PlayerDB<DB>} */
			const { save, data } = player.db();

			if (data.inv === "anarchy") {
				return player.tell("§cВы уже находитесь на анархии!");
			}

			system.run(() =>
				util.handle(() => {
					if (!data.anarchy) {
						InventoryStore.load(
							player,
							{
								equipment: {},
								health: 20,
								xp: 0,
								slots: [
									null,
									null,
									null,
									null,
									null,
									MENU.GetItem(player, true),
								],
							},
							{ clearAll: true }
						);
						randomTeleport(
							player,
							{ x: 500, y: 0, z: 500 },
							{ x: 1500, y: 0, z: 1500 },
							{
								elytra: true,
								teleportCallback(loc) {
									if (getSettings(player).showCoordinates)
										player.tell(
											`§aВы были перемещены на ${Vector.string(loc)}. `
										);
									else player.tell("§aВы были перемещены.");
								},
								keepInSkyTime: 8,
								keepInSkyCallback(remaining) {
									if (remaining) {
										player.onScreenDisplay.setActionBar(
											`  §aВы полетите через §f${remaining}\n§eНе забудьте открыть элитры!`
										);
										player.playSound("note.pling", {
											pitch: Math.max(1 - remaining / 8, 0),
										});
									} else {
										player.playSound("note.pling");
										player.onScreenDisplay.setActionBar(`§6Мягкой посадки!`);
									}
								},
							}
						);
						data.inv = "anarchy";
					} else {
						InventoryStore.load(
							player,
							AnarchyInventory.getEntityStore(player.id)
						);
						data.inv = "anarchy";

						player.teleport(data.anarchy);
						delete data.anarchy;
					}

					save();
				})
			);
		}
	);
}

import {
	ItemStack,
	MinecraftBlockTypes,
	MinecraftItemTypes,
	Vector,
	system,
	world,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "../../../lib/List/effects.js";
import {
	EditableLocation,
	InventoryStore,
	Options,
	XEntity,
	util,
} from "../../../xapi.js";
import { MENU } from "../../Server/Menu/var.js";
import { JOIN } from "../../Server/OnJoin/var.js";
import { RadiusRegion, Region } from "../../Server/Region/Region.js";
import { loadRegionsWithGuards } from "../../Server/Region/index.js";
import { zone } from "../Minigames/BattleRoyal/zone.js";
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

const StartAxeItem = new ItemStack(MinecraftItemTypes.woodenAxe);
StartAxeItem.setCanDestroy(
	Object.entries(MinecraftBlockTypes)
		.filter((e) => e[0].match(/log/i))
		.map((e) => e[1].id)
);
StartAxeItem.nameTag = "Начальный топор";
StartAxeItem.setLore(["§r§7Начальный топор"]);

const SpawnInventory = {
	xp: 0,
	health: 20,
	equipment: {},
	slots: [MENU.item],
};

JOIN.EVENTS.firstTime.subscribe((player) => {
	player.getComponent("inventory").container.addItem(MENU.item);
});

const SpawnLocation = new EditableLocation("spawn", {
	fallback: new Vector(0, 200, 0),
});
if (SpawnLocation.valid) {
	new Portal("spawn", null, null, (player) => {
		if (!Portal.canTeleport(player)) return;
		/** @type {PlayerDB<DB>} */
		const { save, data } = player.db();

		if (data.inv === "anarchy") {
			AnarchyInventory.saveFromEntity(player);
			data.anarchy = Vector.floor(player.location);
		}

		if (data.inv !== "spawn") {
			InventoryStore.load(player, SpawnInventory);
			data.inv = "spawn";
		}

		save();
		player.teleport(SpawnLocation);
	});
	world.setDefaultSpawnLocation(SpawnLocation);
	let spawnregion = Region.locationInRegion(SpawnLocation, "overworld");
	console.log(spawnregion);
	if (!spawnregion || !(spawnregion instanceof RadiusRegion)) {
		spawnregion = new RadiusRegion(
			{ x: SpawnLocation.x, z: SpawnLocation.z, y: SpawnLocation.y },
			200,
			"overworld",
			{
				doorsAndSwitches: false,
				openContainers: false,
				pvp: false,
				allowedEntitys: "all",
				owners: [],
			}
		);
	}
	system.runPlayerInterval(
		(player) => {
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
		},
		"SpawnRegion",
		20
	);
}
const AnarchyCenter = new EditableLocation("anarchy_center");
if (AnarchyCenter.valid) {
	system.runInterval(
		() => {
			const players = world.getPlayers();
			const radius = players.length * 50;

			const rmax = {
				x: AnarchyCenter.x + radius,
				y: 0,
				z: AnarchyCenter.z + radius,
			};

			const rmin = {
				x: AnarchyCenter.x - radius,
				y: 0,
				z: AnarchyCenter.z - radius,
			};

			for (const p of players) {
				const l = Vector.floor(p.location);
				if (
					l.x >= rmax.x &&
					l.x <= rmax.x + 10 &&
					l.z <= rmax.z &&
					l.z >= rmin.z
				)
					return zone.tp(p, true, rmax);

				if (
					l.x >= rmax.x - 10 &&
					l.x <= rmax.x &&
					l.z <= rmax.z &&
					l.z >= rmin.z
				)
					return zone.warn(p, true, rmax);

				if (
					l.z >= rmax.z &&
					l.z <= rmax.z + 10 &&
					l.x <= rmax.x &&
					l.x >= rmin.x
				)
					return zone.tp(p, false, rmax);

				if (
					l.z >= rmax.z - 10 &&
					l.z <= rmax.z &&
					l.x <= rmax.x &&
					l.x >= rmin.x
				)
					return zone.warn(p, false, rmax);

				if (
					l.x <= rmin.x &&
					l.x >= rmin.x - 10 &&
					l.z <= rmax.z &&
					l.z >= rmin.z
				)
					return zone.tp(p, true, rmin, true);

				if (
					l.x <= rmin.x + 10 &&
					l.x >= rmin.x &&
					l.z <= rmax.z &&
					l.z >= rmin.z
				)
					return zone.warn(p, true, rmin);

				if (
					l.z <= rmin.z &&
					l.z >= rmin.z - 10 &&
					l.x <= rmax.x &&
					l.x >= rmin.x
				)
					return zone.tp(p, false, rmin, true);

				if (
					l.z <= rmin.z + 10 &&
					l.z >= rmin.z &&
					l.x <= rmax.x &&
					l.x >= rmin.x
				)
					return zone.warn(p, false, rmin);

				/** @type {PlayerDB<DB>} */
				const { data, save } = p.db();
				if (data.inv !== "anarchy") {
					if (p.id in AnarchyInventory._.STORES) {
						InventoryStore.load(p, AnarchyInventory.getEntityStore(p.id, true));
						data.inv = "anarchy";
						save();
					}
				}
			}
		},
		"zone",
		10
	);
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
								slots: [StartAxeItem],
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
									player.tell("§eРаскройте элитры для быстрого падения!");
									player.playSound("note.pling");
								},
								keepInSkyTime: 20,
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

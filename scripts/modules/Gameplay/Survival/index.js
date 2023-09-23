import {
	EquipmentSlot,
	ItemStack,
	MinecraftBlockTypes,
	MinecraftItemTypes,
	Player,
	Vector,
	system,
	world,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "../../../lib/List/effects.js";
import { EditableLocation, InventoryStore, util } from "../../../xapi.js";
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

console.log("SURVIVAL LOADED");

loadRegionsWithGuards(
	// Common actions guard
	(player, region, context) => {
		if (region) {
			if (region.permissions.owners.includes(player.id)) return true;
		} else {
			const heldItem = player
				.getComponent("equipment_inventory")
				.getEquipmentSlot(EquipmentSlot.mainhand);
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

	(player, currentRegion) => {
		if (currentRegion && !currentRegion?.permissions.pvp) {
			player.triggerEvent("player:spawn");
		}
	},
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

for (const key of Object.keys(JOIN.EVENT_DEFAULTS)) {
	JOIN.EVENTS[key].unsubscribe(JOIN.EVENT_DEFAULTS[key]);
}

JOIN.EVENTS.firstTime.subscribe((player) => {
	player.getComponent("inventory").container.addItem(MENU.item);
});

export const Spawn = {
	startAxeItem: new ItemStack(MinecraftItemTypes.woodenAxe),
	startAxeCanBreak: Object.entries(MinecraftBlockTypes)
		.filter((e) => e[0].match(/log/i))
		.map((e) => e[1].id),
	inventory: {
		xp: 0,
		health: 20,
		equipment: {},
		slots: [MENU.item],
	},
	location: new EditableLocation("spawn", {
		fallback: new Vector(0, 200, 0),
	}),
	/** @type {undefined | Region} */
	region: void 0,
};

Spawn.startAxeItem.setCanDestroy(Spawn.startAxeCanBreak);
Spawn.startAxeItem.nameTag = "Начальный топор";
Spawn.startAxeItem.setLore(["§r§7Начальный топор"]);

/**
 *
 * @param {Player} player
 */
function spawnInventory(player) {
	/** @type {PlayerDB<DB>} */
	const { save, data } = player.db();
	let needSave = false;

	if (data.inv === "anarchy") {
		Anarchy.inventory.saveFromEntity(player, {
			rewrite: false,
			keepInventory: false,
		});
		data.anarchy = Vector.floor(player.location);
		needSave = true;
	}

	if (data.inv !== "spawn") {
		InventoryStore.load({ to: player, from: Spawn.inventory });
		data.inv = "spawn";
		needSave = true;
	}

	if (needSave) save();
}

if (Spawn.location.valid) {
	new Portal("spawn", null, null, (player) => {
		if (!Portal.canTeleport(player)) return;
		spawnInventory(player);

		player.teleport(Spawn.location);
	});
	world.setDefaultSpawnLocation(Spawn.location);
	Spawn.region = Region.locationInRegion(Spawn.location, "overworld");
	if (!Spawn.region || !(Spawn.region instanceof RadiusRegion)) {
		Spawn.region = new RadiusRegion(
			{ x: Spawn.location.x, z: Spawn.location.z, y: Spawn.location.y },
			200,
			"overworld",
			{
				doorsAndSwitches: false,
				openContainers: false,
				pvp: false,
				allowedEntitys: "all",
				owners: [],
			},
		);
	}
	system.runPlayerInterval(
		(player) => {
			if (Spawn.region && Spawn.region.vectorInRegion(player.location)) {
				spawnInventory(player);

				player.addEffect(MinecraftEffectTypes.Saturation, 1, {
					amplifier: 255,
					showParticles: false,
				});
			}
		},
		"SpawnRegion",
		20,
	);
}

export const Anarchy = {
	centerLocation: new EditableLocation("anarchy_center"),
	portalLocation: new EditableLocation("anarchy"),
	inventory: new InventoryStore("anarchy"),
	/** @type {undefined | Portal} */
	portal: void 0,
};
if (Anarchy.centerLocation.valid) {
	system.runInterval(
		() => {
			const players = world.getPlayers();
			const radius = players.length * 50;

			const rmax = {
				x: Anarchy.centerLocation.x + radius,
				y: 0,
				z: Anarchy.centerLocation.z + radius,
			};

			const rmin = {
				x: Anarchy.centerLocation.x - radius,
				y: 0,
				z: Anarchy.centerLocation.z - radius,
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

				// TODO detect if player in the zone
				// anarchyInventory(p, p.db());
			}
		},
		"zone",
		10,
	);
}

/**
 *
 * @param {Player} player
 * @param {PlayerDB<DB>} param1
 */
function anarchyInventory(player, { data, save }, ss = true) {
	if (data.inv !== "anarchy") {
		if (player.id in Anarchy.inventory._.STORES) {
			InventoryStore.load({
				to: player,
				from: Anarchy.inventory.getEntityStore(player.id, true),
			});
			data.inv = "anarchy";
			if (ss) save();
		}
	}
}

/**
 * @typedef {{anarchy?: Vector3, inv: "anarchy" | "spawn" | "mg"}} DB
 */

if (Anarchy.portalLocation.valid) {
	Anarchy.portal = new Portal(
		"anarchy",
		Vector.add(Anarchy.portalLocation, { x: 0, y: -1, z: -1 }),
		Vector.add(Anarchy.portalLocation, { x: 0, y: 1, z: 1 }),
		(player) => {
			if (!Portal.canTeleport(player)) return;
			/** @type {PlayerDB<DB>} */
			const { save, data } = player.db();

			if (data.inv === "anarchy") {
				return player.tell("§cВы уже находитесь на анархии!");
			}

			system.run(() =>
				util.catch(() => {
					if (!data.anarchy || !(player.id in Anarchy.inventory._.STORES)) {
						randomTeleport(
							player,
							{ x: 500, y: 0, z: 500 },
							{ x: 1500, y: 0, z: 1500 },
							{
								elytra: true,
								teleportCallback() {
									player.tell("§a> §fВы были перемещены.");
									player.playSound("note.pling");
								},
								keepInSkyTime: 20,
							},
						);

						InventoryStore.load({
							from: {
								equipment: {},
								health: 20,
								xp: 0,
								slots: [Spawn.startAxeItem],
							},
							to: player,
							clearAll: true,
						});
						data.inv = "anarchy";
						save();
					} else {
						anarchyInventory(player, { data, save }, false);

						player.teleport(data.anarchy);
						delete data.anarchy;
						save();
					}
				}),
			);
		},
	);
}

import { BlockLocation, MinecraftBlockTypes, MinecraftDimensionTypes, Player, world } from "@minecraft/server";
import { createWaiter, setTickInterval, sleep, ThrowError, XA } from "xapi.js";
import { ActionForm } from "../../../lib/Form/ActionForm.js";
import { CONFIG_MENU } from "../../Menu/var.js";
import { JOIN_EVENTS } from "../../OnJoin/events.js";
import { lang } from "./lang.js";
import { Region } from "../utils/Region.js";
import { findFreePlace } from "./utils.js";
import { MessageForm } from "../../../lib/Form/MessageForm.js";

const DB = new XA.instantDB(world, "buildRegion");

const squarePlace = -55;

/**
 *
 * @param {IRegionCords} from
 * @param {IRegionCords} to
 */
async function fillRegion(from, to) {
	const firstLoc = new BlockLocation(from.x, squarePlace, from.z);
	const secondLoc = new BlockLocation(to.x, squarePlace, to.z);
	const exec = createWaiter(10);
	for (const loc of safeBlocksBetween(firstLoc.above(), secondLoc.above(), true)) {
		await exec();
		XA.dimensions.overworld.getBlock(loc).setType(MinecraftBlockTypes.grass);
	}
	for (const loc of safeBlocksBetween(firstLoc, secondLoc, true)) {
		await exec();
		XA.dimensions.overworld.getBlock(loc).setType(MinecraftBlockTypes.allow);
	}
}

/**
 *
 * @param {Player} player
 * @param {Region} region
 */
function teleportToRegion(player, region) {
	player.teleport(
		{ x: region.from.x, y: squarePlace + 3, z: region.from.z },
		XA.dimensions.overworld,
		player.rotation.x,
		player.rotation.y
	);
}

/**
 *
 * @param {Player} player
 */
async function CreateRegion(player, tp = true) {
	const place = await findFreePlace();

	const region = new Region(place.from, place.to, MinecraftDimensionTypes.overworld, {
		owners: [player.id],
		doorsAndSwitches: false,
		allowedEntitys: ["minecraft:player", "minecraft:item"],
		openContainers: false,
		pvp: false,
	});
	DB.set(player.id, region.key);
	fillRegion(region.from, region.to);
	if (tp) teleportToRegion(player, region);
	return region;
}

JOIN_EVENTS.playerGuide.subscribe((player) => {
	player.playSound("random.levelup");
	player.tell(lang.newPlayer);
	const oldRegion = DB.get(player.id);
	if (!oldRegion) CreateRegion(player);
});

/**
 * @param {Player} player
 * @param {string} text
 * @param {string} yesText
 * @param {() => void} onYesAction
 * @param {string} noText
 * @param {() => void} onNoAction
 */
function propmt(player, text, yesText, onYesAction, noText, onNoAction) {
	new MessageForm("Вы уверены?", text).setButton1(yesText, onYesAction).setButton2(noText, onNoAction).show(player);
}

CONFIG_MENU.menu = (player) => {
	const regionID = DB.get(player.id);
	let region = Region.getAllRegions().find((e) => e.key === regionID);
	if (!region) {
		player.tell("§cРегион был создан.");
		CreateRegion(player);
		return false;
	}
	const menu = new ActionForm("Меню площадки", lang.regionManageBody(region, player))
		.addButton("Переместиться", null, () => {
			teleportToRegion(player, region);
			player.tell("§b> §3Вы были перемещены на свою площадку");
		})
		.addButton("Перейти на новую", null, () => {
			player.tell("§7Пока не сделал");
		})
		.addButton("§cОчистить", null, () => {
			propmt(
				player,
				"§fВы уверены что хотите §cочистить площадку§f? Это действие нельзя отменить.",
				"§cВсе равно очистить",
				async () => {
					let auto = 1;
					let pr0 = 0;
					let pr1 = 0;
					let pr2 = 0;
					const end = setTickInterval(
						() => {
							if (auto === 0) pr0 += 0.1;
							if (auto === 2) pr2 += 0.1;
							player.onScreenDisplay.setActionBar(pr0.toFixed(2) + "% " + pr1.toFixed(2) + "% " + pr2.toFixed(2) + "%");
						},
						0,
						"ResetSquare_ProgressActionbar"
					);
					const loc1 = { x: region.from.x, y: -63, z: region.from.z };
					const loc2 = { x: region.to.x, y: 300, z: region.to.z };
					const blocks = await getBlocksCount(loc1, loc2);

					auto = 1;
					let c = 0;
					let vc = 0;

					for (const loc of safeBlocksBetween(loc1, loc2, true)) {
						vc++;
						pr1 = vc / ~~(blocks / 100);

						const block = XA.dimensions.overworld.getBlock(loc);
						if (block.typeId === MinecraftBlockTypes.air.id) continue;
						c++;
						if (c % 100 === 0) {
							await sleep(1);
						}
						XA.dimensions.overworld.runCommandAsync(`setblock ${loc.x} ${loc.y} ${loc.z} air`);
					}
					auto = 2;
					await fillRegion(region.from, region.to);
					end();
				},
				"Отмена, не очищайте",
				() => {}
			);
		});
	return menu;
};

/**
 *
 * @param {import("@minecraft/server").IVec3} loc1
 * @param {import("@minecraft/server").IVec3} loc2
 */
async function getBlocksCount(loc1, loc2) {
	const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
	const [xmin, xmax] = minmax(loc1.x, loc2.x);
	const [zmin, zmax] = minmax(loc1.z, loc2.z);
	const [ymin, ymax] = minmax(loc1.y, loc2.y);
	let c = 0;
	for (let x = xmin; x <= xmax; x++) {
		for (let z = zmin; z <= zmax; z++) {
			for (let y = ymin; y <= ymax; y++) {
				c++;
				if (c % 100 === 0) await sleep(1);
			}
		}
	}
	return c;
}

/**
 *
 * @template T
 * @param {import("@minecraft/server").IVec3} loc1
 * @param {import("@minecraft/server").IVec3} loc2
 * @param {EX<T, boolean>} convert
 * @returns {Generator<T extends true ? BlockLocation : {x: number;y: number;z: number;}, void, unknown>}
 */
function* safeBlocksBetween(loc1, loc2, convert) {
	try {
		const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
		const [xmin, xmax] = minmax(loc1.x, loc2.x);
		const [zmin, zmax] = minmax(loc1.z, loc2.z);
		const [ymin, ymax] = minmax(loc1.y, loc2.y);
		for (let x = xmin; x <= xmax; x++) {
			for (let z = zmin; z <= zmax; z++) {
				for (let y = ymin; y <= ymax; y++) {
					// @ts-expect-error
					if (convert) yield new BlockLocation(x, y, z);
					// @ts-expect-error
					else yield { x, y, z };
				}
			}
		}
	} catch (e) {
		ThrowError(e);
	}
}

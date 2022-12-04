import { BlockLocation, MinecraftBlockTypes, MinecraftDimensionTypes, Player, world } from "@minecraft/server";
import { createWaiter, handler, IS, setTickInterval, sleep, ThrowError, XA } from "xapi.js";
import { ActionForm } from "../../../lib/Form/ActionForm.js";
import { MessageForm } from "../../../lib/Form/MessageForm.js";
import { CONFIG_MENU } from "../../Menu/var.js";
import { JOIN_EVENTS } from "../../OnJoin/events.js";
import { Region } from "../utils/Region.js";
import { lang } from "./lang.js";
import { findFreePlace } from "./utils.js";

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

/**
 *
 * @param {string} spining
 * @param {number} percents
 */
function getProgressBar(spining, percents) {
	const pb = new Array(10).join(" ").split(" ");
	const e = pb.map((_, i) => (Math.floor(percents / 10) > i ? "§a▌" : "§7▌"));
	return `§d${spining[0]} ${e.join("")} §f${~~percents}%`;
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
			const CD = new XA.Cooldown(DB, "ARCHIVE", player.id, 1000 * 60 * 60 * 24);
			const status = CD.statusTime;

			if (status !== "EXPIRED") {
				player.tell("§cПодожди еще §f" + (status / (60 * 60 * 24)).toFixed(2) + "§c часов");
			} else
				propmt(
					player,
					"§fВы уверены, что хотите перейти на новую площадку? После этого §cвернуть предыдущую§f будет уже §cнельзя§f. Это действие можно совершать раз в 24 часа.",
					"§cДа, перейти",
					() => {
						const oldRegion = DB.get(player.id);
						DB.set("ARHIVE:" + player.id, oldRegion);
						for (const builder of world.getPlayers()) {
							if (IS(builder.id, "builder"))
								builder.tell("§b> §3Игрок §f" + player.name + "§r§3 перевел свой квадрат в архив.");
						}
						CreateRegion(player, true);
						CD.update();
					},
					"Отмена",
					() => {}
				);
		})
		.addButton("§cОчистить", null, () => {
			const CD = new XA.Cooldown(DB, "CLEAR", player.id, 1000 * 60);
			const status = CD.statusTime;

			if (status !== "EXPIRED") {
				player.tell("§cПодожди еще §f" + status.toFixed(2) + "§c секунд");
			} else
				propmt(
					player,
					"§fВы уверены что хотите §cбезвозвратно§f очистить площадку§f? Это действие §cнельзя отменить.",
					"§cВсе равно очистить",
					async () => {
						let percents = 0;
						let spining = ["/", "-", "\\", "|"];
						let time = 0;
						const end = setTickInterval(
							() => {
								player.onScreenDisplay.setActionBar(getProgressBar(spining[0], percents));
								time++;
								if (time % 10 === 0) spining = spining.slice(1).concat(spining.shift());
							},
							0,
							"ResetSquare_ProgressActionbar"
						);
						const loc1 = { x: region.from.x, y: -63, z: region.from.z };
						const loc2 = { x: region.to.x, y: 100, z: region.to.z };
						const blocks = getBlocksCount(loc1, loc2);

						let c = 0;
						await sleep(40);
						console.warn("start gen");
						const e = safeBlocksBetween(loc1, loc2, true);
						await sleep(40);
						console.warn("end gen");

						for (const loc of e) {
							c++;
							if (c % 500 === 0 || c === 0) await sleep(0);
							percents = c / ~~(blocks / 100);

							const block = XA.dimensions.overworld.getBlock(loc);
							if (block.typeId === MinecraftBlockTypes.air.id) continue;
							// await XA.dimensions.overworld.runCommandAsync(`setblock ${loc.x} ${loc.y} ${loc.z} air`);
							block.setType(MinecraftBlockTypes.air);
						}
						await handler(() => fillRegion(region.from, region.to));
						CD.update();
						end();
					},
					"Отмена, не очищайте",
					() => menu.show(player)
				);
		});
	return menu;
};

/**
 *
 * @param {Vector3} loc1
 * @param {Vector3} loc2
 */
function getBlocksCount(loc1, loc2) {
	const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
	const [xmin, xmax] = minmax(loc1.x, loc2.x);
	const [zmin, zmax] = minmax(loc1.z, loc2.z);
	const [ymin, ymax] = minmax(loc1.y, loc2.y);
	const x = xmax - xmin + 1;
	const y = ymax - ymin + 1;
	const z = zmax - zmin + 1;
	return x * y * z;
}

/**
 *
 * @template T
 * @param {Vector3} loc1
 * @param {Vector3} loc2
 * @param {EX<T, boolean>} convert
 * @returns {Generator<T extends true ? BlockLocation : Vector3, void, unknown>}
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

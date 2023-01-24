import { world } from "@minecraft/server";
import { handle, IS, XA } from "xapi.js";
import { ActionForm } from "../../../lib/Form/ActionForm.js";
import { CONFIG_MENU } from "../../Menu/var.js";
import { JOIN_EVENTS } from "../../OnJoin/events.js";
import { Region } from "../utils/Region.js";
import { ClearRegion, CreateRegion, fillRegion, prompt, teleportToRegion } from "./utils.js";

const DB = XA.tables.buildRegion;

JOIN_EVENTS.playerClosedGuide.subscribe((player) => {
	player.playSound("random.levelup");
	player.tell("Приветствую на сервере, лера напиши уже гайд");
	const oldRegion = DB.get(player.id);
	if (!oldRegion) CreateRegion(player);
});

CONFIG_MENU.menu = (player) => {
	const regionID = DB.get(player.id);
	let Pregion = Region.getAllRegions().find((e) => e.key === regionID);
	if (!Pregion) {
		player.tell("§b> §3У вас не было ни одной незаархивированной площадки, поэтому мы создали вам новую.");
		CreateRegion(player);
		return false;
	}

	const current_region = Region.blockLocationInRegion(player.location, player.dimension.id);
	const inOwnRegion = current_region && current_region.permissions.owners[0] === Pregion.permissions.owners[0];

	let body = "";
	const add = (/** @type {string} */ t) => (body += `${t}\n`);
	add(`§3Координаты вашей площадки: §c${Pregion.from.x} §b${Pregion.from.z}\n `);

	/** @type {import("../../../lib/Class/XRequest.js").XRequest} */
	let req;
	/** @type {string} */
	let regionOwnerName;

	if (current_region) {
		req = new XA.Request(DB, "EDIT", current_region.permissions.owners[0]);
		regionOwnerName = XA.Entity.getNameByID(current_region.permissions.owners[0]);
		if (!inOwnRegion) {
			if (regionOwnerName) {
				add("§3Сейчас вы на площадке игрока §f" + regionOwnerName);
			} else {
				const oldRegionData = DB.get("ARCHIVE:" + current_region.key);
				const oldRegion = Array.isArray(oldRegionData) ? oldRegionData : [];
				regionOwnerName = XA.Entity.getNameByID(oldRegion[0]);
				add("§cЭто площадка была заархивирована");
				add("§3Строители: §f" + oldRegion.map(XA.Entity.getNameByID).join("§r§3, §f"));
			}
		} else {
			add("§3Вы находитесь на §fсвоей§3 площадке");
		}
		add("");
	}

	const menu = new ActionForm("Меню площадки", body);
	/**
	 *
	 * @param {ActionForm} form
	 */
	function addBackButton(form) {
		form.addButton("§b< §3Назад", null, () => menu.show(player));
		return form;
	}

	menu.addButton("Площадки", null, () => {
		const form = new ActionForm(
			"Доступные площадки",
			"§3Здесь вы можете телепортироваться на любую площадку, где можете строить"
		);
		/**
		 *
		 * @param {Region} region
		 * @param {string} name
		 */
		const toPlatform = (region, name) => {
			form.addButton(name, null, () => {
				teleportToRegion(player, region);
				player.tell("§b> §3Вы были перемещены на площадку §r" + name);
			});
		};
		toPlatform(Pregion, "Основная");
		for (const reg of Region.getAllRegions().filter(
			(e) => e.permissions.owners.includes(player.id) && e.key !== Pregion.key
		)) {
			toPlatform(reg, XA.Entity.getNameByID(reg.permissions.owners[0]));
		}
		addBackButton(form);
		form.show(player);
	});

	if (current_region) {
		if (inOwnRegion) {
			menu.addButton("Строители", null, () => {
				const form = new ActionForm("Строители", "§3Тут можно просмотреть и удалить строителей вашего региона");

				for (const id of current_region.permissions.owners.slice(1)) {
					const playerName = XA.Entity.getNameByID(id);
					form.addButton(playerName, null, () => {
						prompt(
							player,
							"§cВы точно хотите удалить игрока §r" + playerName + "§r§c из строителей вашего региона?",
							"ДА",
							() => {
								current_region.permissions.owners = current_region.permissions.owners.filter((e) => e !== id);
								current_region.update();
								player.tell("§b> §3Успешно!");
								const requestedPlayer = XA.Entity.fetch(id);
								if (requestedPlayer)
									requestedPlayer.tell(`§cИгрок §f${player.name} §r§cудалил вас из строителей своей площадки`);
							},
							"нет",
							() => form.show(player)
						);
					});
				}

				addBackButton(form);
				form.show(player);
			});
			menu.addButton("Запросы редактирования", null, () => {
				const newmenu = new ActionForm(
					"Запросы редактирования",
					"§3В этом меню вы можете посмотреть запросы на редактирование площадки, отправление другими игроками"
				);
				for (const ID of req.activeRequests) {
					const name = XA.Entity.getNameByID(ID);
					newmenu.addButton(name, null, () => {
						prompt(
							player,
							"Принимая запрос на редактирование, вы даете игроку право редактировать ваш регион.",
							"Принять",
							() => {
								const requestedPlayer = XA.Entity.fetch(ID);
								if (requestedPlayer) {
									req.deleteRequest(ID);
									player.tell("§b> §3Запрос на редактирование успешно принят!");
									requestedPlayer.tell(`§b> §3Игрок §f${player.name} §r§3принял ваш запрос на редактирование площадки`);
									current_region.permissions.owners.push(requestedPlayer.id);
									current_region.update();
								} else {
									player.tell("§4> §3Игрок не в сети.");
								}
							},
							"Отклонить",
							() => {
								req.deleteRequest(ID);
								newmenu.show(player);
							}
						);
					});
				}
				addBackButton(newmenu);
				newmenu.show(player);
			});
			menu.addButton("Перейти на новую", null, () => {
				const CD = new XA.Cooldown(DB, "ARHCIVE", player, 1000 * 60 * 60 * 24);
				if (CD.isExpired())
					prompt(
						player,
						"§fВы уверены, что хотите перейти на новую площадку? После этого настощая площадка будет архивирована, и §cвернуть её§f будет уже §cнельзя§f. Это действие можно совершать раз в 24 часа.",
						"§cДа, перейти",
						() => {
							const oldRegionID = DB.get(player.id);
							const oldRegion = Region.getAllRegions().find((e) => e.key === oldRegionID);

							DB.set("ARCHIVE:" + oldRegionID, [...oldRegion.permissions.owners]);
							const u = [];
							oldRegion.forEachOwner((player, i, arr) => {
								u.push(player.id);
								player.tell("§cРегион игрока §f" + arr[0].name + "§r§c был заархивирован.");
							});

							oldRegion.permissions.owners = [];
							oldRegion.update();

							for (const builder of world.getPlayers()) {
								if (!u.includes(builder.id) && IS(builder.id, "builder"))
									builder.tell("§b> §3Игрок §f" + player.name + "§r§3 перевел свою площадку в архив.");
							}

							CreateRegion(player, true);
							CD.update();
						},
						"Отмена",
						() => {}
					);
			});
			menu.addButton("§cОчистить", null, () => {
				const CD = new XA.Cooldown(DB, "CLEAR", player, 1000 * 60);
				if (CD.isExpired())
					prompt(
						player,
						"§fВы уверены что хотите §cбезвозвратно§f очистить площадку§f? Это действие §cнельзя отменить.",
						"§cВсе равно очистить§r",
						async () => {
							CD.update();
							const end = await ClearRegion(player, Pregion);
							await handle(() => fillRegion(Pregion.from, Pregion.to));
							end();
						},
						"Отмена, не очищайте",
						() => menu.show(player)
					);
			});
		} else if (current_region.permissions.owners[0]) {
			menu.addButton("Запросить разрешение", null, () => {
				const CD = new XA.Cooldown(DB, "REQ", player, 1000 * 60);

				if (CD.isExpired())
					prompt(
						player,
						"Владельцу площадки будет отправлен запрос на редактирование. Если он его примет, вы сможете строить на его площадке.",
						"Запросить",
						() => {
							CD.update();
							req.createRequest(player.id);
							player.tell("§b> §3Запрос на редактирование успешно отправлен!");
							const requestedPlayer = XA.Entity.fetch(current_region.permissions.owners[0]);
							if (requestedPlayer)
								requestedPlayer.tell(`§b> §3Игрок §f${player.name} §r§3отправил вам запрос на редактирование площадки`);
						},
						"Отмена",
						() => menu.show(player)
					);
			});
		}
		if (IS(player.id, "admin")) {
			menu.addButton("§cУдалить площадку", null, () => {
				prompt(
					player,
					`§cВы действительно хотите удалить площадку игрока §r§f${regionOwnerName}?`,
					"§cДа",
					async () => {
						const end = await ClearRegion(player, current_region);
						current_region.forEachOwner((player) =>
							player.tell(`§cРегион с владельцем §f${regionOwnerName}§r§c был удален`)
						);
						current_region.delete();
						end();
					},
					"НЕТ!",
					() => menu.show(player)
				);
			});
		}
	}

	return menu;
};

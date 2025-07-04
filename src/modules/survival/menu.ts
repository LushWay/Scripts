import { Player } from "@minecraft/server";
import { BUTTON, doNothing } from "lib";
import {
	achievementsForm,
	achievementsFormName,
} from "lib/achievements/command";
import { clanMenu } from "lib/clan/menu";
import { Core } from "lib/extensions/core";
import { form } from "lib/form/new";
import { i18n } from "lib/i18n/text";
import { Mail } from "lib/mail";
import { Join } from "lib/player-join";
import { questsMenu } from "lib/quest/menu";
import { Menu } from "lib/rpg/menu";
import { playerSettingsMenu } from "lib/settings";
import { mailMenu } from "modules/commands/mail";
import { statsForm } from "modules/commands/stats";
import { baseMenu } from "modules/places/base/base-menu";
import { wiki } from "modules/wiki/wiki";
import { Anarchy } from "../places/anarchy/anarchy";
import { Spawn } from "../places/spawn";
import { recurForm } from "./recurring-events";
import { speedrunForm } from "./speedrun/target";

function tp(
	player: Player,
	place: InventoryTypeName,
	inv: InventoryTypeName,
	color = "§9",
	text = i18n`Спавн`,
	extra: Text = ""
) {
	const here = inv === place;
	if (here)
		extra = i18n`${extra ? extra.to(player.lang) + " " : ""}§8Вы тут`.to(
			player.lang
		);
	if (extra) extra = "\n" + extra.to(player.lang);
	const prefix = here ? "§7" : color;
	return `${prefix}> ${inv === place ? "§7" : "§r§f"}${text.to(
		player.lang
	)} ${prefix}<${extra}`;
}

Menu.form = form((f, { player, self }) => {
	const inv = player.database.inv;
	f.title(Core.name, "§c§u§s§r");
	f.button(
		tp(player, "spawn", inv, "§9", i18n`Спавн`),
		"textures/ui/worldsIcon",
		() => {
			Spawn.portal?.teleport(player);
		}
	)
		.button(
			tp(player, "anarchy", inv, "§c", i18n`Анархия`),
			"textures/blocks/tnt_side",
			() => {
				Anarchy.portal?.teleport(player);
			}
		)
		.button(
			tp(player, "mg", inv, `§6`, i18n`Миниигры`, i18n`§7СКОРО!`),
			"textures/blocks/bedrock",
			self
		);

	if (player.database.inv === "anarchy") {
		f.button(
			i18n`Задания`.badge(player.database.quests?.active.length),
			"textures/ui/sidebar_icons/genre",
			() => questsMenu(player, self)
		);

		f.button(
			achievementsFormName(player),
			"textures/blocks/gold_block",
			achievementsForm
		);

		f.button(i18n`База`, "textures/blocks/barrel_side", baseMenu({}));
		const [clanText, clan] = clanMenu(player, self);
		f.button(clanText, "textures/ui/FriendsIcon", clan);
	}

	f.button(
		i18n.nocolor`§6Донат\n§7СКОРО!`,
		"textures/ui/permissions_op_crown",
		self
	)
		.button(
			i18n.nocolor`§fПочта`.badge(Mail.getUnreadMessagesCount(player.id)),
			"textures/ui/feedIcon",
			() => mailMenu(player, self)
		)
		.button(i18n.nocolor`§bВики`, BUTTON.search, wiki.show)

		.button(i18n.nocolor`§7Настройки`, BUTTON.settings, () =>
			playerSettingsMenu(player, self)
		)
		.button(i18n`Еще`, BUTTON[">"], secondPage);
});

const secondPage = form((f) => {
	f.title(Core.name, "§c§u§s§r");
	f.button(i18n`Цели`, BUTTON["?"], speedrunForm);
	f.button(i18n`Лидеры`, BUTTON["?"], doNothing);
	f.button(i18n`События`, BUTTON["?"], recurForm);
	f.button(i18n`Статистика`, BUTTON["?"], statsForm({}));
});

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
	if (firstJoin) Menu.item.give(player, { mode: "ensure" });
});

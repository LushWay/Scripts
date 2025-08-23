import { Player } from "@minecraft/server";
import { is, Portal, stringify } from "lib";
import { Achievement } from "lib/achievements/achievement";
import { LoreForm } from "lib/form/lore";
import { form } from "lib/form/new";
import { selectPlayer } from "lib/form/select-player";
import { i18n } from "lib/i18n/text";
import { statsForm } from "./stats";

new Command("player")
	.setAliases("p", "profile")
	.setPermissions("everybody")
	.setDescription(i18n`Общее меню игрока`)
	.executes((ctx) => playerMenu({ targetId: ctx.player.id }).command(ctx));

const playerMenu = form.params<{ targetId: string }>(
	(f, { player, params: { targetId }, self }) => {
		const moder = is(player.id, "moderator");
		const db = Player.database.getImmutable(targetId);
		f.title(db.name ?? targetId);

		if (moder) {
			f.button(i18n`Другие игроки`, () => {
				selectPlayer(player, i18n`открыть его меню`.to(player.lang), self).then(
					(target) => {
						playerMenu({ targetId: target.id }).show(player, self);
					}
				);
			});
		}
		f.button(i18n`Статистика`, statsForm({ targetId }));

		f.button(
			i18n`Задания`
				.badge(db.quests?.active.length)
				.size(db.quests?.completed.length),
			form((f) => f.body(stringify(db.quests)))
		);
		f.button(
			form((f) => {
				const all = Achievement.list.length;
				const completed = db.achivs?.s.filter((e) => !!e.r).length ?? 0;
				f.title(
					i18n`Достижения ${completed}/${all} (${(
						(completed / all) *
						100
					).toFixed(0)}%%)`
				);
				f.body(stringify(db.achivs));
			})
		);
		f.button(
			form((f) => {
				const portals = db.unlockedPortals;
				f.title(i18n`Порталы ${portals?.length ?? 0}/${Portal.portals.size}`);
				f.body(portals?.join("\n") ?? "");
			})
		);
		f.button(
			form((f) => {
				const lore = LoreForm.getAll(targetId);
				f.title(i18n`Лор прочитан`.size(lore.length));
				f.body(lore.map((e) => stringify(e)).join("\n"));
			})
		);
	}
);

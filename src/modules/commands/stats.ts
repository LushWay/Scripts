import { Player, ScoreName, ScoreNames } from "@minecraft/server";
import {
	capitalize,
	ScoreboardDB,
	scoreboardDisplayNames,
	scoreboardObjectiveNames,
} from "lib";
import { form } from "lib/form/new";
import { i18n, textTable } from "lib/i18n/text";

new Command("stats")
	.setDescription(i18n`Показывает статистику по игре`)
	.executes((ctx) => statsForm({}).command(ctx));

export const statsForm = form.params<{ targetId?: string }>(
	(f, { player, params: { targetId = player.id } }) => {
		const scores = ScoreboardDB.getOrCreateProxyFor(targetId);

		f.title(i18n.header`Статистика игрока ${Player.nameOrUnknown(targetId)}`);
		f.body(
			textTable([
				[
					scoreboardDisplayNames.totalOnlineTime,
					formatDate(scores.totalOnlineTime),
				],
				[
					scoreboardDisplayNames.anarchyOnlineTime,
					formatDate(scores.anarchyOnlineTime),
				],
				"",
				[
					scoreboardDisplayNames.lastSeenDate,
					i18n.time(Date.now() - scores.lastSeenDate * 1000),
				],
				[
					scoreboardDisplayNames.anarchyLastSeenDate,
					i18n.time(Date.now() - scores.anarchyLastSeenDate * 1000),
				],
				"",
				...statsTable(
					scores,
					(key) => key,
					(n) => n.to(player.lang)
				),
				"",
				...statsTable(
					scores,
					(key) => `anarchy${capitalize(key)}`,
					(n) => i18n`Анархия ${n}`.to(player.lang)
				),
			])
		);
	}
);

function formatDate(date: number) {
	return i18n.hhmmss(date);
}

function statsTable(
	s: Player["scores"],
	getKey: (k: ScoreNames.Stat) => ScoreName,
	getN: (n: Text) => string
) {
	const table: Text.Table[number][] = [];
	for (const key of scoreboardObjectiveNames.stats) {
		const k = getKey(key);
		table.push([getN(scoreboardDisplayNames[k]), s[k]]);
		if (key === "kills")
			table.push([
				getN(i18n`Убийств/Смертей`),
				s[getKey("kills")] / s[getKey("deaths")],
			]);
		if (key === "damageGive")
			table.push([
				getN(i18n`Нанесено/Получено`),
				s[getKey("damageGive")] / s[getKey("damageRecieve")],
			]);
	}
	return table satisfies Text.Table;
}

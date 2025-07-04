import { Player } from "@minecraft/server";
import { ActionForm, ArrayForm, Mail, Menu, Settings, ask } from "lib";
import { i18n, i18nPlural } from "lib/i18n/text";
import { Join } from "lib/player-join";
import { Rewards } from "lib/utils/rewards";

const command = new Command("mail")
	.setDescription(i18n`Посмотреть входящие сообщения почты`)
	.setPermissions("member")
	.executes((ctx) => mailMenu(ctx.player));

const getSettings = Settings.player(...Menu.settings, {
	mailReadOnOpen: {
		name: i18n`Читать письмо при открытии`,
		description: i18n`Помечать ли письмо прочитанным при открытии`,
		value: true,
	},
	mailClaimOnDelete: {
		name: i18n`Собирать награды при удалении`,
		description: i18n`Собирать ли награды при удалении письма`,
		value: true,
	},
});

const getJoinSettings = Settings.player(...Join.settings.extend, {
	unreadMails: {
		name: i18n`Почта`,
		description: i18n`Показывать ли при входе сообщение с кол-вом непрочитанных`,
		value: true,
	},
});

export function mailMenu(player: Player, back?: VoidFunction) {
	new ArrayForm(
		i18n`Почта`.badge(Mail.getUnreadMessagesCount(player.id)),
		Mail.getLetters(player.id)
	)
		.filters({
			unread: {
				name: i18n`Непрочитанные`,
				description: i18n`Показывать только непрочитанные сообщения`,
				value: false,
			},
			unclaimed: {
				name: i18n`Несобранные награды`,
				description: i18n`У письма есть несобранные награды`,
				value: false,
			},
			sort: {
				name: i18n`Соритровать по`,
				value: [
					["date", i18n`Дате`],
					["name", i18n`Имени`],
				],
			},
		})
		.button(({ letter, index }) => {
			const name = `${letter.read ? "§7" : "§f"}${letter.title}${
				letter.read ? "\n§8" : "§c*\n§7"
			}${letter.content}`;
			return [
				name,
				() => {
					letterDetailsMenu({ letter, index }, player);
					if (getSettings(player).mailReadOnOpen)
						Mail.readMessage(player.id, index);
				},
			];
		})
		.sort((keys, filters) => {
			if (filters.unread) keys = keys.filter((letter) => !letter.letter.read);

			if (filters.unclaimed)
				keys = keys.filter((letter) => !letter.letter.rewardsClaimed);

			filters.sort === "name"
				? keys.sort((letterA, letterB) =>
						letterA.letter.title.localeCompare(letterB.letter.title)
				  )
				: keys.reverse();

			return keys;
		})
		.back(back)
		.show(player);
}

function letterDetailsMenu(
	{ letter, index }: ReturnType<(typeof Mail)["getLetters"]>[number],
	player: Player,
	back = () => mailMenu(player),
	message = ""
) {
	const settings = getSettings(player);
	// TODO Fix collors
	// TODO Rewrite to use new form
	const form = new ActionForm(
		letter.title,
		i18n`${message}${letter.content}\n\n§l§fНаграды:§r\n${Rewards.restore(
			letter.rewards
		).toString(player)}`.to(player.lang)
	).addButtonBack(back, player.lang);

	if (!letter.rewardsClaimed && letter.rewards.length)
		if (player.database.inv !== "anarchy") {
			form.button(i18n.disabled`Забрать награду`.to(player.lang), () =>
				letterDetailsMenu(
					{ letter, index },
					player,
					back,
					i18n.error`Вы не можете забрать награды не находясь на анархии`.to(
						player.lang
					)
				)
			);
		} else {
			form.button(i18n`Забрать награду`.to(player.lang), () => {
				Mail.claimRewards(player, index);
				letterDetailsMenu(
					{ letter, index },
					player,
					back,
					message + i18n.success`Награда успешно забрана!\n\n`.to(player.lang)
				);
			});
		}

	if (!letter.read && !settings.mailReadOnOpen)
		form.button(i18n`Пометить как прочитанное`.to(player.lang), () => {
			Mail.readMessage(player.id, index);
			back();
		});

	let deleteDescription = i18n.error`Удалить письмо?`.to(player.lang);
	if (!letter.rewardsClaimed) {
		if (getSettings(player).mailClaimOnDelete) {
			deleteDescription += i18n` Все награды будут собраны автоматически`.to(
				player.lang
			);
		} else {
			deleteDescription +=
				i18n` Вы потеряете все награды, прикрепленные к письму!`.to(
					player.lang
				);
		}
	}

	form.button(i18n.error`Удалить письмо`.to(player.lang), null, () => {
		ask(player, deleteDescription, i18n`Удалить`, () => {
			if (getSettings(player).mailClaimOnDelete)
				Mail.claimRewards(player, index);
			Mail.deleteMessage(player, index);
			back();
		});
	});

	form.show(player);
}

Join.onMoveAfterJoin.subscribe(({ player }) => {
	if (!getJoinSettings(player).unreadMails) return;

	const unreadCount = Mail.getUnreadMessagesCount(player.id);
	if (unreadCount === 0) return;

	player.info(
		i18n.join`${i18n.header`Почта:`} ${i18nPlural`У вас ${unreadCount} непрочитанных сообщений!`} ${command}`
	);
});

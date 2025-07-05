import { EntityDamageCause, Player, system, world } from "@minecraft/server";
import { PlayerProperties } from "lib/assets/player-json";
import { Cooldown } from "lib/cooldown";
import { ask } from "lib/form/message";
import { i18n } from "lib/i18n/text";
import { Join } from "lib/player-join";
import { createLogger } from "lib/utils/logger";
import { ms } from "lib/utils/ms";

const newbieTime = ms.from("hour", 2);

const property = PlayerProperties["lw:newbie"];

export function isNewbie(player: Player) {
	return !!player.database.survival.newbie;
}

export function askForExitingNewbieMode(
	player: Player,
	reason: Text,
	callback: VoidFunction,
	back: VoidFunction = () => player.success(i18n`Успешно отменено`)
) {
	if (!isNewbie(player)) return callback();

	ask(
		player,
		i18n`Если вы совершите это действие, вы потеряете статус новичка:
 - Другие игроки смогут наносить вам урон
 - Другие игроки смогут забирать ваш лут после смерти`,
		i18n.error`Я больше не новичок`,
		() => {
			exitNewbieMode(player, reason);
			callback();
		},
		i18n`НЕТ, НАЗАД`,
		back
	);
}

const logger = createLogger("Newbie");

function exitNewbieMode(player: Player, reason: Text) {
	if (!isNewbie(player)) return;

	player.warn(i18n.warn`Вы ${reason}, поэтому вышли из режима новичка.`);
	delete player.database.survival.newbie;
	player.setProperty(property, false);

	logger.player(player).info`Exited newbie mode because ${reason}`;
}

export function enterNewbieMode(player: Player, resetAnarchyOnlineTime = true) {
	player.database.survival.newbie = 1;
	if (resetAnarchyOnlineTime) player.scores.anarchyOnlineTime = 0;
	player.setProperty(property, true);
}

Join.onFirstTimeSpawn.subscribe(enterNewbieMode);
Join.onMoveAfterJoin.subscribe(({ player }) => {
	const value = isNewbie(player);
	if (value !== player.getProperty(property))
		player.setProperty(property, value);
});

const damageCd = new Cooldown(ms.from("min", 1), false);

world.afterEvents.entityHurt.subscribe(
	({ hurtEntity, damage, damageSource: { damagingEntity, cause } }) => {
		if (!(hurtEntity instanceof Player)) return;
		if (damage === -17179869184) return;

		const health = hurtEntity.getComponent("health");
		const denyDamage = () => {
			logger.player(hurtEntity)
				.info`Recieved damage ${damage}, health ${health?.currentValue}, with cause ${cause}`;
			if (health) health.setCurrentValue(health.currentValue + damage);
			hurtEntity.teleport(hurtEntity.location);
		};

		if (
			hurtEntity.database.survival.newbie &&
			cause === EntityDamageCause.fireTick
		) {
			denyDamage();
		} else if (
			damagingEntity instanceof Player &&
			damagingEntity.database.survival.newbie
		) {
			if (damageCd.isExpired(damagingEntity)) {
				denyDamage();
				askForExitingNewbieMode(
					damagingEntity,
					i18n`ударили игрока`,
					() => void 0,
					() => damagingEntity.info(i18n`Будь осторожнее в следующий раз.`)
				);
			} else {
				exitNewbieMode(damagingEntity, i18n.warn`снова ударили игрока`);
			}
		}
	}
);

new Command("newbie")
	.setPermissions("member")
	.setDescription(i18n`Используйте, чтобы выйти из режима новичка`)
	.executes((ctx) => {
		if (isNewbie(ctx.player)) {
			askForExitingNewbieMode(
				ctx.player,
				i18n`использовали команду`,
				() => void 0
			);
		} else return ctx.error(i18n`Вы не находитесь в режиме новичка.`);
	})
	.overload("set")
	.setPermissions("techAdmin")
	.setDescription(i18n`Вводит в режим новичка`)
	.executes((ctx) => {
		enterNewbieMode(ctx.player);
		ctx.player.success();
	});

system.runPlayerInterval((player) => {
	if (isNewbie(player) && player.scores.anarchyOnlineTime * 2.5 > newbieTime)
		exitNewbieMode(player, i18n.warn`провели на анархии больше 2 часов`);
}, "newbie mode exit");

import { EntityDamageCause, Player, system, world } from "@minecraft/server";
import { XA } from "xapi.js";
import { SERVER } from "../../Server/Server/var.js";
import { LOCKED_TITLES, PVP, PVP_LOCKED } from "./var.js";

const options = XA.WorldOptions("pvp", {
	enabled: {
		value: SERVER.type === "survival",
		desc: "Возможность входа в пвп режим (блокировка всех тп команд)§r",
	},
	cooldown: { value: 15, desc: "Да" },
});

const getPlayerSettings = XA.PlayerOptions("pvp", {
	indicator: {
		desc: "§aВключает§7 титл попадания по энтити из лука",
		value: true,
	},
	bow_sound: {
		desc: "§aВключает§7 звук попадания по энтити из лука",
		value: true,
	},
});

system.runInterval(
	() => {
		if (options.enabled) {
			for (const p of world.getPlayers({
				scoreOptions: [{ objective: PVP.scoreboard.id }],
			})) {
				PVP.add(p, -1);
			}

			for (const e in LOCKED_TITLES) {
				if (LOCKED_TITLES[e]) LOCKED_TITLES[e]--;
				else delete LOCKED_TITLES[e];
			}
		}
	},
	"PVP",
	20
);

system.runPlayerInterval(
	(player) => {
		if (!XA.state.modules_loaded || !options.enabled) return;
		const score = PVP.get(player);

		if (PVP_LOCKED.includes(player.id) || score < 0) return;

		const settings = getPlayerSettings(player);
		if (!settings.indicator) return;

		const q = score === options.cooldown || score === 0;
		const g = (/** @type {string} */ p) => (q ? `§4${p}` : "");

		if (!LOCKED_TITLES[player.id]) {
			-player.onScreenDisplay.setActionBar(
				`${g("»")} §6PvP: ${score} ${g("«")}`
			);
		}
	},
	"PVP player",
	0
);

world.events.entityHurt.subscribe((data) => {
	const damage = data.damageSource;
	if (
		![
			EntityDamageCause.fireTick,
			EntityDamageCause.fireworks,
			EntityDamageCause.projectile,
			EntityDamageCause.entityAttack,
		].includes(damage.cause)
	)
		return;

	if (
		!data.hurtEntity.typeId.startsWith("minecraft:") ||
		!options.enabled ||
		PVP_LOCKED.includes(data.hurtEntity.id)
	)
		return;

	// Its player.chatClose
	if (
		!damage.damagingEntity &&
		data.hurtEntity &&
		damage.cause === EntityDamageCause.entityAttack
	)
		return;

	const lastHit = data.hurtEntity.getComponent("minecraft:health").current <= 0;

	// Если наносящий урон игрок
	if (damage.damagingEntity instanceof Player) {
		// Кулдаун
		PVP.set(damage.damagingEntity, options.cooldown);
		// Стата
		SERVER.stats.damageGive.add(damage.damagingEntity, data.damage);
		if (lastHit) SERVER.stats.kills.add(damage.damagingEntity, 1);

		const setting = getPlayerSettings(damage.damagingEntity);

		const isBow = damage.cause === EntityDamageCause.projectile;
		if (isBow && setting.bow_sound) {
			playHitSound(damage.damagingEntity, data.damage);
		}

		if (setting.indicator) {
			if (!lastHit) {
				// Обычный урон
				damage.damagingEntity.onScreenDisplay.setActionBar(
					`§c-${data.damage}♥`
				);
			} else {
				// Kill
				if (data?.hurtEntity instanceof Player) {
					// Player
					damage.damagingEntity.onScreenDisplay.setActionBar(
						`§gВы ${isBow ? "застрелили" : "убили"} §6${data.hurtEntity.name}`
					);
				} else {
					// Entity

					const entityName = data.hurtEntity.typeId.replace("minecraft:", "");
					damage.damagingEntity.runCommand(
						"titleraw @s actionbar " +
							JSON.stringify({
								rawtext: [
									{ text: "§6" },
									{
										translate: `entity.${entityName}.name`,
									},
									{ text: isBow ? " §gзастрелен" : " §gубит" },
								],
							})
					);
				}
			}

			LOCKED_TITLES[damage.damagingEntity.id] = 2;
		}
	}

	if (data.hurtEntity instanceof Player) {
		PVP.set(data.hurtEntity, options.cooldown);
		SERVER.stats.damageRecieve.add(data.hurtEntity, data.damage);
	}
});

/**
 *
 * @param {Player} player
 * @param {number} damage
 */
function playHitSound(player, damage) {
	player.playSound("block.end_portal_frame.fill", {
		location: player.location,
		pitch: damage / 2,
		volume: 1,
	});
}

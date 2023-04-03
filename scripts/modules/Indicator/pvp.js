import { EntityDamageCause, Player, system, world } from "@minecraft/server";
import { XA } from "../../xapi.js";
import { SERVER } from "../Server/var.js";
import { LOCKED_TITLES, PVP, PVP_LOCKED } from "./var.js";

const options = XA.WorldOptions("pvp", {
	enabled: {
		value: SERVER.type === "survival",
		desc: "Возможность входа в пвп режим (блокировка всех тп команд)§r",
	},
	cooldown: { value: 15, desc: "Да" },
	bowhit: { value: true, desc: "Да" },
});

const getPlayerSettings = XA.PlayerOptions("pvp", {
	title_enabled: {
		desc: "§aВключает§7 титл попадания по энтити из лука",
		value: true,
	},
	sound_enabled: {
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
				PVP.eAdd(p, -1);
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
		const score = PVP.eGet(player);

		if (PVP_LOCKED.includes(player.id) || score < 0) return;

		const settings = getPlayerSettings(player);
		if (!settings.title_enabled) return;

		const q = score === options.cooldown || score === 0;
		const g = (/** @type {string} */ p) => (q ? `§4${p}` : "");

		if (!LOCKED_TITLES[player.id]) {
			player.onScreenDisplay.setActionBar(
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

	const lastHit = data.hurtEntity.getComponent("minecraft:health").current <= 0;

	if (!(data?.hurtEntity instanceof Player)) return;
	if (damage?.damagingEntity instanceof Player) {
		// Кулдаун
		PVP.eSet(damage.damagingEntity, options.cooldown);
		// Стата
		SERVER.stats.damageGive.eAdd(damage.damagingEntity, data.damage);
		if (lastHit) SERVER.stats.kills.eAdd(damage.damagingEntity, 1);

		const setting = getPlayerSettings(damage.damagingEntity);

		//Если лук, визуализируем
		if (damage.cause === "projectile" && options.bowhit) {
			if (setting.sound_enabled)
				playHitSound(damage.damagingEntity, data.damage);

			if (setting.title_enabled) {
				damage.damagingEntity.onScreenDisplay.setActionBar(
					lastHit
						? `§gВы застрелили §6${data.hurtEntity.name}`
						: `§c-${data.damage}♥`
				);
				LOCKED_TITLES[damage.damagingEntity.id] = 2;
			}
		}
		if (
			damage.cause !== "projectile" &&
			lastHit &&
			data.hurtEntity instanceof Player
		)
			damage.damagingEntity.onScreenDisplay.setActionBar(
				`§gВы убили §6${data.hurtEntity.name}`
			);
	}
	PVP.eAdd(data.hurtEntity, options.cooldown);
	SERVER.stats.damageRecieve.eAdd(data.hurtEntity, data.damage);
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

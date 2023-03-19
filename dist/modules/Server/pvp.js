import { Entity, Player, world } from "@minecraft/server";
import { ScoreboardDB } from "../../lib/Database/Scoreboard.js";
import { setPlayerInterval, setTickInterval, XA } from "../../xapi.js";
import { getServerType, InRaid } from "../Region/var.js";
import { stats } from "./var.js";
const lockedTitleScore = "lockedtitle";
const pvpScore = "pvp";
XA.objectives.push({ id: lockedTitleScore, watch: true });
XA.objectives.push({ id: pvpScore, watch: true });
const PVP = new ScoreboardDB(pvpScore);
const LOCKTITLE = new ScoreboardDB(lockedTitleScore);
const options = XA.WorldOptions("pvp", {
    enabled: {
        value: getServerType() === "survival",
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
setTickInterval(() => {
    for (const id in InRaid) {
        const player = XA.Entity.fetch(id);
        if (player) {
            if (PVP.eGet(player) === 0) {
                player.tell("§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны.");
                player.playSound("mob.wolf.bark");
            }
            PVP.eSet(player, InRaid[id]);
            delete InRaid[id];
            continue;
        }
        InRaid[id]--;
        if (InRaid[id] <= 0) {
            // Время вышло, игрока не было
            delete InRaid[id];
            continue;
        }
    }
    if (options.enabled) {
        const opts = (/** @type {string} */ obj) => {
            return {
                scoreOptions: [{ objective: obj, minScore: 1 }],
            };
        };
        for (const p of world.getPlayers(opts(pvpScore)))
            PVP.eAdd(p, -1);
        for (const p of world.getPlayers(opts(lockedTitleScore)))
            PVP.eAdd(p, -1);
    }
}, 20, "PVP");
setPlayerInterval((player) => {
    if (!XA.state.modules_loaded || !options.enabled)
        return;
    const score = PVP.eGet(player);
    if (isPvpLocked(player) || !score)
        return;
    const settings = getPlayerSettings(player);
    if (!settings.title_enabled)
        return;
    const q = score === options.cooldown;
    const g = (/** @type {string} */ p) => (q ? `§4${p}` : "");
    if (LOCKTITLE.eGet(player) <= 0)
        player.onScreenDisplay.setActionBar(`${g("»")} §6PvP: ${score} ${g("«")}`);
}, 0, "PVP player");
world.events.entityHurt.subscribe((data) => {
    const damage = data.damageSource;
    if (!["fire", "fireworks", "projectile"].includes(damage.cause))
        return;
    if (data.hurtEntity.typeId === "t:hpper_minecart" ||
        !options.enabled ||
        isPvpLocked(data.hurtEntity))
        return;
    let lastHit = false;
    if (data.hurtEntity.getComponent("minecraft:health").current - data.damage <=
        0)
        lastHit = true;
    if (damage?.damagingEntity instanceof Player) {
        //Всякая фигня без порядка
        PVP.eSet(damage.damagingEntity, options.cooldown);
        stats.damageGive.eAdd(damage.damagingEntity, data.damage);
        if (lastHit)
            stats.kills.eAdd(damage.damagingEntity, 1);
        const setting = getPlayerSettings(damage.damagingEntity);
        //Если лук, визуализируем
        if (damage.cause === "projectile" && options.bowhit) {
            if (setting.sound_enabled)
                playHitSound(damage.damagingEntity, data.damage);
            if (setting.title_enabled && data.hurtEntity instanceof Player) {
                damage.damagingEntity.onScreenDisplay.setActionBar(lastHit
                    ? `§gВы застрелили §6${data.hurtEntity.name}`
                    : `§c-${data.damage}♥`);
                LOCKTITLE.eSet(damage.damagingEntity, 2);
            }
        }
        if (damage.cause !== "projectile" &&
            lastHit &&
            data.hurtEntity instanceof Player)
            damage.damagingEntity.onScreenDisplay.setActionBar(`§gВы убили §6${data.hurtEntity.name}`);
    }
    if (!(data?.hurtEntity instanceof Player))
        return;
    PVP.eAdd(data.hurtEntity, options.cooldown);
    stats.damageRecieve.eAdd(data.hurtEntity, data.damage);
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
/**
 *
 * @param {Entity} entity
 * @returns
 */
function isPvpLocked(entity) {
    return XA.Entity.getTagStartsWith(entity, "lockpvp:");
}

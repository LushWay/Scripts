import { GameMode, Player, world } from '@minecraft/server'
import { askNew } from 'lib/form/new'
import { i18n, textTable } from 'lib/i18n/text'
import { playerMoveHistory } from 'lib/player-move'
import { Region } from 'lib/region'
import { RegionEvents } from 'lib/region/events'
import { EquippmentLevel } from 'lib/rpg/equipment-level'
import { isNewbie } from 'lib/rpg/newbie'
import { doNothing } from 'lib/util'
import { WeakPlayerMap } from 'lib/weak-player-storage'

export function warnAboutEnteringDangerousRegion(region: Region, level: EquippmentLevel.Global) {
  const cache = new WeakPlayerMap<{
    armor: EquippmentLevel.Armor
    items: EquippmentLevel.Items
  }>({
    removeOnLeave: true,
  })
  const addToCache = (player: Player) => cache.set(player, EquippmentLevel.getCached(player))

  EquippmentLevel.cacheUpdate.subscribe(({ player, items, armor }) => {
    const cached = cache.get(player)
    if (!cached) return
    if (cached.armor !== armor || cached.items !== items) cache.delete(player)
  })

  function pushAway(player: Player, region: Region) {
    const moveTo = getFarthestPoint(player, region)
    if (moveTo) player.teleport(moveTo.location, { dimension: world[moveTo.dimensionType] })
  }

  function getFarthestPoint(player: Player, region: Region) {
    const moveHistory = playerMoveHistory.get(player)
    if (!moveHistory) return

    for (const position of [...moveHistory].reverse()) {
      if (
        position.dimensionType === region.dimensionType &&
        !region.area.isNear(position, 10) &&
        !warnAboutEnteringDangerousRegion.shouldNotReturnToRegions.some(e => e.area.isIn(position))
      )
        return position
    }
  }

  RegionEvents.onEnter(region, player => {
    if (
      EquippmentLevel.is(level, player, EquippmentLevel.Mode.Every) ||
      [GameMode.Spectator, GameMode.Creative].includes(player.getGameMode())
    )
      return
    if (cache.get(player)) return

    pushAway(player, region)

    askNew(
      player,
      textTable(
        [
          i18n`Опасно!`,
          [i18n`Зона`, region.displayName ?? region.name],
          '',
          [i18n`Требуемый уровень`, EquippmentLevel.emojiLevel[level]],
          [i18n`Ваш уровень`, EquippmentLevel.getEmoji(player) || i18n`у вас вообще экипировки нет`],
          '',
          region.permissions.pvp === 'pve' || isNewbie(player)
            ? i18n.success`Другие игроки не смогут забрать ваши ресурсы после смерти в этой зоне.`
            : i18n.error`Другие игроки смогут забрать ваши ресурсы после смерти в этой зоне`,
        ],
        false,
      ),
      i18n.success`Вернуться назад`,
      doNothing,
      i18n.error`Я готов принять риск`,
      () => addToCache(player),
    )
  })
}

warnAboutEnteringDangerousRegion.shouldNotReturnToRegions = [] as Region[]

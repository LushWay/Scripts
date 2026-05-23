import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { Items } from 'lib/assets/custom-items'
import { PlayerEvents } from 'lib/assets/player-json'
import {
  actionGuard,
  ActionGuardOrder,
  NOT_MOB_ENTITIES,
  PVP_ENTITIES,
  regionPermissions,
  SafeAreaRegion,
} from 'lib/region'
import { RegionEvents } from 'lib/region/events'
import { isNotPlaying } from 'lib/utils/game'

import { Player, system } from '@minecraft/server'
import { Cooldown } from 'lib/cooldown'

import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n } from 'lib/i18n/text'
import { askForExitingNewbieMode, isNewbie } from 'lib/rpg/newbie'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { doNothing } from 'lib/util'
import { ms } from 'lib/utils/ms'
import { BaseRegion } from 'modules/places/base/region'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import 'lib/clan/disable-clan-pvp'

SafeAreaRegion.enableGamemodeChange()

NOT_MOB_ENTITIES.push(CustomEntityTypes.Grave, CustomEntityTypes.Loot)
PVP_ENTITIES.push(CustomEntityTypes.Fireball, CustomEntityTypes.Cannon)

RegionEvents.onInterval.subscribe(({ player, currentRegion }) => {
  const isPlaying = !isNotPlaying(player)

  if (typeof currentRegion !== 'undefined' && isPlaying) {
    if (currentRegion.permissions.pvp === false) {
      player.triggerEvent(
        player.database.inv === 'spawn' ? PlayerEvents['player:spawn'] : PlayerEvents['player:safezone'],
      )
    }
  }
})

regionPermissions.itemToProjectile.set(Items.Fireball, CustomEntityTypes.Fireball)

const textCooldown = new Cooldown(ms.from('sec', 2), false)

function youCannot(player: Player) {
  if (textCooldown.isExpired(player)) {
    system.delay(() =>
      player.onScreenDisplay.setActionBar(
        i18n.error`Вы не можете ломать не поставленные игроками блоки\nвне вашей базы, шахты или зоны добычи`.to(
          player.lang,
        ),
        ActionbarPriority.High,
      ),
    )
  }
  return false
}

actionGuard((player, region, ctx) => {
  if (region) return

  const { event, type } = ctx

  // If block has schedule data it means it was placed by player

  switch (type) {
    case 'place':
      ScheduleBlockPlace.setBlock(event.block, ms.from('min', 1))
      return true

    case 'break': {
      const scheduled = !!ScheduleBlockPlace.has(event.block, event.block.dimension.type)

      if (scheduled) return true
      else return youCannot(player)
    }

    case 'interactWithBlock': {
      const scheduled = !!ScheduleBlockPlace.has(event.block, event.block.dimension.type)

      if (scheduled) return true
      else return !!event.itemStack
    }
  }
}, ActionGuardOrder.Permission)

// Base mostly mimics the no region policy to be less detectable.
// Its still pretty easy to detect it by placing blocks though
actionGuard((player, region, ctx) => {
  if (!(region instanceof BaseRegion)) return

  const { type } = ctx
  switch (type) {
    case 'place':
      return youCannot(player)

    case 'interactWithBlock': {
      return youCannot(player)
    }
  }
}, ActionGuardOrder.Permission)

actionGuard((player, region, ctx) => {
  if (ctx.type === 'interactWithEntity') {
    if (region instanceof SafeAreaRegion) {
      if (ctx.event.target.typeId === MinecraftEntityTypes.ArmorStand) return false
    }
    return true
  }
  if (ctx.type === 'interactWithBlock') return false
}, ActionGuardOrder.Lowest)

const dontKillNewbiewsTimeout = new Cooldown(ms.from('sec', 3))

regionPermissions.isPvPallowed.push((attacker, reciever) => {
  if (isNewbie(reciever)) {
    system.delay(() => {
      if (dontKillNewbiewsTimeout.isExpired(attacker)) attacker.fail(i18n.error`Нельзя сражаться с новичками!`)
    })
    return false
  }

  if (isNewbie(attacker)) {
    system.delay(() => {
      if (dontKillNewbiewsTimeout.isExpired(attacker)) {
        askForExitingNewbieMode(attacker, i18n`вы атаковали игрока`, doNothing)
      }
    })
    return false
  }
})

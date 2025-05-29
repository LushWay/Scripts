import { Player, system, world } from '@minecraft/server'
import { actionGuard, Cooldown, inventoryIsEmpty, ms, Settings, Vec } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { Quest } from 'lib/quest/quest'
import { ActionGuardOrder, forceAllowSpawnInRegion, Region } from 'lib/region'
import { SphereArea } from 'lib/region/areas/sphere'
import { SafePlace } from 'modules/places/lib/safe-place'
import { Spawn } from 'modules/places/spawn'

const gravestoneOwnerKey = 'owner'
const gravestoneDiedAtPve = 'gravestoneDiedAtPve'
export const gravestoneEntityTypeId = CustomEntityTypes.Grave
const gravestoneTag = 'gravestone'
const gravestoneSpawnedAt = 'gravestoneAt'
const gravestoneCleanupAfter = ms.from('sec', 5)

world.afterEvents.entityDie.subscribe(event => {
  if (event.deadEntity instanceof Player) {
    const settings = getSettings(event.deadEntity)
    const playerContainer = event.deadEntity.container

    if (playerContainer?.emptySlotsCount === playerContainer?.size && settings.noInvMessage) {
      event.deadEntity.warn('Вы умерли без вещей!')
      if (event.deadEntity.isSimulated()) return
    }

    const { dimension, id: playerId, location, name } = event.deadEntity
    event.deadEntity.database.survival.deadAt = Vec.floor(location)
    const head = event.deadEntity.getHeadLocation()
    const pveRegion = Region.getManyAt(event.deadEntity).find(e => e.permissions.pvp === 'pve' || !e.permissions.pvp)

    const gravestone = dimension.spawnEntity(gravestoneEntityTypeId, head)
    forceAllowSpawnInRegion(gravestone)
    gravestone.setDynamicProperty(gravestoneOwnerKey, playerId)
    gravestone.setDynamicProperty(gravestoneSpawnedAt, Date.now())
    gravestone.setDynamicProperty(gravestoneDiedAtPve, !!pveRegion)
    gravestone.addTag(gravestoneTag)
    gravestone.nameTag = `§c§h§e§s§t§6Могила ${event.deadEntity.database.survival.newbie ? '§bновичка ' : pveRegion ? '§a(безопасно) ' : ''}§f${name}`

    const gravestoneContainer = gravestone.container

    system.delay(() => {
      dimension.getEntities({ location: head, type: 'minecraft:item', maxDistance: 2 }).forEach(e => {
        const item = e.getComponent('item')?.itemStack
        if (item) {
          gravestoneContainer?.addItem(item)
          e.remove()
        }
      })
    })
  }
})

const getSettings = Settings.player(...Quest.playerSettings.extend, {
  restoreInvQuest: {
    name: 'Задание "Вернуть вещи"',
    description: 'Включать ли задание по восстановлению инвентаря после смерти',
    value: true,
  },
  noInvMessage: {
    name: 'Сообщение при смерти с пустым инвентарём',
    description: 'Отправлять ли сообщение, если вы умерли, и в инвентаре не было предметов',
    value: true,
  },
})

world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
  if (initialSpawn) return

  const deadAt = player.database.survival.deadAt
  if (!deadAt) return

  const places = SafePlace.places
    .map(place => ({
      distance: place.safeArea
        ? Vec.distance(place.safeArea.area.center, deadAt) -
          (place.safeArea.area instanceof SphereArea ? place.safeArea.area.radius : 0)
        : 0,
      place,
    }))
    .sort((a, b) => a.distance - b.distance)

  const nearestPlace = places[0]?.place

  if (nearestPlace?.portalTeleportsTo.valid) {
    player.teleport(nearestPlace.portalTeleportsTo)
  } else {
    delete player.database.survival.anarchy
    Spawn.switchInventory(player)
  }

  if (getSettings(player).restoreInvQuest) {
    // Exit previous death quest
    quest.exit(player)
    quest.enter(player)
  }
})

system.runInterval(
  () => {
    for (const entity of world.overworld.getEntities({ type: gravestoneEntityTypeId, tags: [gravestoneTag] })) {
      const at = entity.getDynamicProperty(gravestoneSpawnedAt)
      if (typeof at !== 'number') {
        entity.remove()
        continue
      }

      if (Cooldown.isExpired(at, gravestoneCleanupAfter)) {
        if (inventoryIsEmpty(entity)) entity.remove()
      }
    }
  },
  'gravestones cleanup',
  20,
)

actionGuard((player, _, ctx) => {
  if (ctx.type !== 'interactWithEntity') return
  if (ctx.event.target.typeId !== gravestoneEntityTypeId) return

  const owner = ctx.event.target.getDynamicProperty(gravestoneOwnerKey)
  if (typeof owner !== 'string') return true

  if (owner === player.id) return true
  if (Player.database.getImmutable(owner).survival.newbie) {
    ctx.event.player.fail('Вы не можете открыть могилу новичка!')
    return false
  }
  if (ctx.event.target.getDynamicProperty(gravestoneDiedAtPve)) {
    ctx.event.player.fail('Вы не можете открыть могилу игрока, умершего в зоне без сражения!')
    return false
  }

  return true
}, ActionGuardOrder.Feature)

const quest = new Quest('restoreInventory', 'Вернуть вещи', 'Верните вещи после смерти!', (q, player) => {
  const { deadAt } = player.database.survival
  if (!deadAt) return q.failed('Ваше место смерти потерялось!')

  q.dynamic(Vec.string(deadAt, true))
    .description(
      `Верните свои вещи${
        player.database.survival.newbie ? ', никто кроме вас их забрать не может' : ''
      }, они ждут вас на ${Vec.string(deadAt, true)}§6!`,
    )
    .activate(ctx => {
      ctx.place = deadAt
      ctx.world.afterEvents.playerInteractWithEntity.subscribe(event => {
        if (event.player.id !== player.id) return
        const key = event.target.getDynamicProperty(gravestoneOwnerKey)
        if (key !== player.id) return

        ctx.next()
      })
    })

  q.end(() => {
    player.success('Поздравляем! В будущем постарайтесь быть осторожнее.')
  })
})

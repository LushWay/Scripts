import { Player, system, world } from '@minecraft/server'
import { Cooldown, Settings, Vector, actionGuard, inventoryIsEmpty, ms } from 'lib'
import { CustomEntityTypes } from 'lib/assets/config'
import { Quest } from 'lib/quest/quest'
import { PlaceWithSafeArea } from 'modules/places/lib/place-with-safearea'
import { Spawn } from 'modules/places/spawn'
import { ALLOW_SPAWN_PROP } from 'modules/survival/guard'

const gravestoneOwnerKey = 'owner'
export const gravestoneEntity = CustomEntityTypes.Loot
const gravestoneTag = 'gravestone'
const gravestoneSpawnedAt = 'gravestoneAt'
const gravestoneCleanupAfter = ms.from('sec', 5)

world.afterEvents.entityDie.subscribe(event => {
  if (event.deadEntity instanceof Player) {
    const settings = getSettings(event.deadEntity)
    const playerContainer = event.deadEntity.container

    if (playerContainer?.emptySlotsCount === playerContainer?.size && settings.noInvMessage) {
      event.deadEntity.warn('Вы умерли без вещей!')
    }

    const { dimension, id: playerId, location, name } = event.deadEntity
    event.deadEntity.database.survival.deadAt = Vector.floor(location)
    const head = event.deadEntity.getHeadLocation()

    const gravestone = dimension.spawnEntity(gravestoneEntity, head)
    gravestone.setDynamicProperty(ALLOW_SPAWN_PROP, true)
    gravestone.setDynamicProperty(gravestoneOwnerKey, playerId)
    gravestone.setDynamicProperty(gravestoneSpawnedAt, Date.now())
    gravestone.addTag(gravestoneTag)
    gravestone.nameTag = `§c§h§e§s§t§6Могила ${event.deadEntity.database.survival.newbie ? '§bновичка ' : ''}§f${name}`

    const gravestoneContainer = gravestone.container

    // if (playerContainer && gravestoneContainer) {
    //   for (const [i, item] of playerContainer.entries()) {
    //     if (!item || item.keepOnDeath) continue
    //     gravestoneContainer.setItem(i, item)
    //     playerContainer.setItem(i, undefined)
    //     console.log('Added', item.typeId, item.amount)
    //   }
    // }

    system.delay(() => {
      dimension.getEntities({ location: head, type: 'minecraft:item', maxDistance: 2 }).forEach(e => {
        const item = e.getComponent('item')?.itemStack
        if (item) {
          gravestoneContainer?.addItem(item)
          e.remove()
          // console.log('Dropped', item.typeId, item.amount)
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

  const places = PlaceWithSafeArea.places
    .map(place => ({
      distance: place.safeArea ? Vector.distance(place.safeArea.center, deadAt) - place.safeArea.radius : 0,
      place,
    }))
    .sort((a, b) => a.distance - b.distance)

  const nearestPlace = places[0]?.place as PlaceWithSafeArea | undefined

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
    for (const entity of world.overworld.getEntities({ type: gravestoneEntity, tags: [gravestoneTag] })) {
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
  if (ctx.event.target.typeId !== gravestoneEntity) return

  const owner = ctx.event.target.getDynamicProperty(gravestoneOwnerKey)
  if (typeof owner !== 'string') return

  if (owner === player.id) return true
  if (Player.database[owner].survival.newbie) return false
})

const quest = new Quest('restoreInventory', 'Вернуть вещи', 'Верните вещи после смерти!', (q, player) => {
  const { deadAt } = player.database.survival
  if (!deadAt) return q.failed('Ваше место смерти потерялось!')

  q.dynamic(`§d!!!`)
    .description(
      `Верните свои вещи${
        player.database.survival.newbie ? ', никто кроме вас их забрать не может' : ''
      }, они ждут вас на ${Vector.string(deadAt, true)}§6!`,
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

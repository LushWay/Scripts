import { Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Cooldown, Settings, Temporary, actionGuard, inventoryIsEmpty, util } from 'lib'
import { DefaultPlaceWithSafeArea } from 'modules/places/lib/DefaultWithSafeArea'
import { Spawn } from 'modules/places/spawn'
import { Quest } from 'modules/quests/lib/quest'
import { ALLOW_SPAWN_PROP } from 'modules/survival/guard'

const gravestoneOwnerKey = 'owner'
export const gravestoneEntity = MinecraftEntityTypes.HopperMinecart
const gravestoneTag = 'gravestone'
const gravestoneSpawnedAt = 'gravestoneAt'
const gravestoneCleanupAfter = util.ms.from('sec', 5)

world.afterEvents.entityDie.subscribe(event => {
  if (event.deadEntity instanceof Player) {
    const settings = getSettings(event.deadEntity)
    const playerContainer = event.deadEntity.container

    if (playerContainer?.emptySlotsCount === playerContainer?.size && settings.noInvMessage) {
      return event.deadEntity.warn('Вы умерли без вещей!')
    }

    const { dimension, id: playerId, location, name } = event.deadEntity
    event.deadEntity.database.survival.deadAt = Vector.floor(location)
    const head = event.deadEntity.getHeadLocation()

    const gravestone = dimension.spawnEntity(gravestoneEntity + '<loot>', head)
    gravestone.setDynamicProperty(ALLOW_SPAWN_PROP, true)
    gravestone.setDynamicProperty(gravestoneOwnerKey, playerId)
    gravestone.setDynamicProperty(gravestoneSpawnedAt, Date.now())
    gravestone.addTag(gravestoneTag)
    gravestone.nameTag = `§6Могила §f${name}`

    const gravestoneContainer = gravestone.container

    if (playerContainer && gravestoneContainer) {
      for (const [i, item] of playerContainer.entries()) {
        if (item?.keepOnDeath) continue
        gravestoneContainer.setItem(i, item)
        playerContainer.setItem(i, undefined)
      }
    }

    system.delay(() => {
      dimension.getEntities({ location: head, type: 'minecraft:item', maxDistance: 2 }).forEach(e => e.teleport(head))
    })
  }
})

// TODO Clear minecart items from inventory/world

const getSettings = Settings.player(...Quest.playerSettingsName, {
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

  const places = DefaultPlaceWithSafeArea.places
    .map(place => ({
      distance: Vector.distance(place.safeArea.center, deadAt) - place.safeArea.radius,
      place,
    }))
    .sort((a, b) => a.distance - b.distance)

  const nearestPlace = places[0].place

  if (nearestPlace && nearestPlace.portalTeleportsTo.valid) {
    player.teleport(nearestPlace.portalTeleportsTo)
  } else {
    delete player.database.survival.anarchy
    Spawn.loadInventory(player)
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

      if (Cooldown.expired(at, gravestoneCleanupAfter)) {
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
  if (Player.database[owner]?.survival.newbie) return false
})

const quest = new Quest(
  { id: 'restoreInventory', name: 'Вернуть вещи', desc: 'Верните вещи после смерти!' },
  (q, player) => {
    const { deadAt } = player.database.survival
    if (!deadAt) return q.failed('Ваше место смерти потерялось!')
    q.dynamic({
      text: `§dВы умерли на\n${Vector.string(deadAt, true)}`,
      description: `Верните свои вещи${
        player.database.survival.newbie ? ', никто кроме вас их забрать не может' : ''
      }, они ждут вас!`,
      activate() {
        return new Temporary(({ world, temp }) => {
          q.targetCompassTo({ place: deadAt, temporary: temp })

          world.afterEvents.playerInteractWithEntity.subscribe(event => {
            if (event.player.id !== player.id) return
            const key = event.target.getDynamicProperty(gravestoneOwnerKey)
            if (key !== player.id) return

            this.next()
          })
        })
      },
    })

    q.end(() => {
      player.success('Поздравляем! В будущем постарайтесь быть осторожнее.')
    })
  },
)

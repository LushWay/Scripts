import { Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { PLAYER_DB, Quest, Region, SafeAreaRegion, Settings, Temporary, actionGuard, inventoryIsEmpty } from 'lib.js'
import { DefaultPlaceWithSafeArea } from 'modules/Places/Default/WithSafeArea.js'
import { Spawn } from 'modules/Places/Spawn.js'
import { ALLOW_SPAWN_PROP } from 'modules/Survival/guard.js'

const gravestoneOwnerKey = 'owner'
const gravestoneEntity = MinecraftEntityTypes.HopperMinecart
const gravestoneTag = 'gravestone'

world.afterEvents.entityDie.subscribe(event => {
  if (event.deadEntity instanceof Player) {
    const { dimension, id: playerId, location, name } = event.deadEntity
    event.deadEntity.database.survival.deadAt = Vector.floor(location)
    const head = event.deadEntity.getHeadLocation()

    const gravestone = dimension.spawnEntity(gravestoneEntity + '<loot>', head)
    gravestone.setDynamicProperty(ALLOW_SPAWN_PROP, true)
    gravestone.setDynamicProperty(gravestoneOwnerKey, playerId)
    gravestone.addTag(gravestoneTag)
    gravestone.nameTag = `§6Могила §f${name}`

    system.delay(() => {
      dimension.getEntities({ location: head, type: 'minecraft:item', maxDistance: 2 }).forEach(e => e.teleport(head))
    })
  }
})

const settings = Settings.player('Смерть', 'death', {
  restoreInvQuest: {
    name: 'Квест восстановления инвентаря',
    desc: 'Включать ли квест восстановления инвентаря после смерти',
    value: true,
  },
})

world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
  if (initialSpawn) return

  const deadAt = player.database.survival.deadAt
  if (!deadAt) return

  /** @type {Region[]} */
  const safeAreas = DefaultPlaceWithSafeArea.places.map(e => e.safeArea)
  const nearestSafeAreas = SafeAreaRegion.nearestRegions(deadAt, player.dimension.type).filter(e =>
    safeAreas.includes(e)
  )
  const nearestPlace = DefaultPlaceWithSafeArea.places.find(e => e.safeArea === nearestSafeAreas[0])

  if (nearestPlace && nearestPlace.portalTeleportsTo.valid) {
    player.teleport(nearestPlace.portalTeleportsTo)
  } else {
    Spawn.loadInventory(player)
  }

  if (settings(player).restoreInvQuest) quest.enter(player)
})

system.runInterval(
  () => {
    for (const entity of world.overworld.getEntities({ type: gravestoneEntity, tags: [gravestoneTag] })) {
      if (inventoryIsEmpty(entity)) entity.remove()
    }
  },
  'gravestones cleanup',
  20
)

actionGuard((player, _, ctx) => {
  if (ctx.type !== 'interactWithEntity') return
  if (ctx.event.target.typeId !== gravestoneEntity) return

  const owner = ctx.event.target.getDynamicProperty(gravestoneOwnerKey)
  if (typeof owner !== 'string') return

  if (owner === player.id) return true
  if (PLAYER_DB[owner]?.survival.newbie) return false
})

const quest = new Quest(
  { id: 'restoreInventory', name: 'Вернуть вещи', desc: 'Верните вещи после смерти!' },
  (q, player) => {
    const { deadAt } = player.database.survival
    if (!deadAt) return q.failed('Ваше место смерти потерялось!')
    q.dynamic({
      text: `§dВерните свои вещи!\n${Vector.string(deadAt, true)}`,
      description: `Верните вещи после смерти!`,
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
  }
)

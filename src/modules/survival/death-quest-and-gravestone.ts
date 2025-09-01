import { Entity, Player, system, world } from '@minecraft/server'
import { actionGuard, Cooldown, EventSignal, inventoryIsEmpty, ms, Settings, Vec } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { i18n, i18nShared, noI18n } from 'lib/i18n/text'
import { Quest } from 'lib/quest/quest'
import { ActionGuardOrder, forceAllowSpawnInRegion, Region } from 'lib/region'
import { SphereArea } from 'lib/region/areas/sphere'
import { noGroup } from 'lib/rpg/place'
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
      event.deadEntity.warn(i18n`Вы умерли без вещей!`)
      if (event.deadEntity.isSimulated()) return
    }

    const { dimension, id: playerId, location, name } = event.deadEntity
    event.deadEntity.database.survival.deadAt2 = { location: Vec.floor(location), dimensionType: dimension.type }
    const head = event.deadEntity.getHeadLocation()
    const pveRegion = Region.getManyAt(event.deadEntity).find(e => e.permissions.pvp === 'pve' || !e.permissions.pvp)

    const gravestone = dimension.spawnEntity<CustomEntityTypes>(gravestoneEntityTypeId, head)
    forceAllowSpawnInRegion(gravestone)
    gravestone.setDynamicProperty(gravestoneOwnerKey, playerId)
    gravestone.setDynamicProperty(gravestoneSpawnedAt, Date.now())
    gravestone.setDynamicProperty(gravestoneDiedAtPve, !!pveRegion)
    gravestone.addTag(gravestoneTag)
    gravestone.nameTag = noI18n.nocolor`§c§h§e§s§t§6Могила ${event.deadEntity.database.survival.newbie ? noI18n.nocolor`§bновичка ` : pveRegion ? noI18n.nocolor`§a(безопасно) ` : ''}§f${name}`
    event.deadEntity.database.survival.gravestoneId = gravestone.id

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
    name: i18n`Задание "Вернуть вещи"`,
    description: i18n`Включать ли задание по восстановлению инвентаря после смерти`,
    value: true,
  },
  noInvMessage: {
    name: i18n`Сообщение при смерти с пустым инвентарём`,
    description: i18n`Отправлять ли сообщение, если вы умерли, и в инвентаре не было предметов`,
    value: true,
  },
})

world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
  if (initialSpawn) return

  const deadAt = player.database.survival.deadAt2
  if (!deadAt) return

  const places = SafePlace.places
    .filter(place => place.safeArea?.dimensionType === deadAt.dimensionType)
    .map(place => ({
      distance: place.safeArea
        ? Vec.distance(place.safeArea.area.center, deadAt.location) -
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

export function gravestoneGetOwner(entity: Entity) {
  const owner = entity.getDynamicProperty(gravestoneOwnerKey)
  return typeof owner === 'string' ? owner : undefined
}

actionGuard((player, _, ctx) => {
  if (ctx.type !== 'interactWithEntity') return
  if (ctx.event.target.typeId !== gravestoneEntityTypeId) return

  const owner = gravestoneGetOwner(ctx.event.target)
  if (typeof owner !== 'string') return true

  if (owner === player.id) return true
  if (Player.database.getImmutable(owner).survival.newbie) {
    ctx.event.player.fail(i18n.error`Вы не можете открыть могилу новичка!`)
    return false
  }
  if (ctx.event.target.getDynamicProperty(gravestoneDiedAtPve)) {
    ctx.event.player.fail(i18n.error`Вы не можете открыть могилу игрока, умершего в зоне без сражения!`)
    return false
  }

  return true
}, ActionGuardOrder.Feature)

world.beforeEvents.entityRemove.subscribe(({ removedEntity }) => {
  const ownerId = gravestoneGetOwner(removedEntity)
  if (!ownerId) return

  const player = Player.database.getImmutable(ownerId)
  if (player.survival.gravestoneId !== removedEntity.id) return

  system.delay(() => EventSignal.emit(onGravestoneRemove, { ownerId }))
})

const onGravestoneRemove = new EventSignal<{ ownerId: string }>()

onGravestoneRemove.subscribe(({ ownerId }) => {
  const onlinePlayer = world.getAllPlayers().find(e => e.id === ownerId)
  if (onlinePlayer) return

  const player = Player.database.get(ownerId)
  delete player.survival.gravestoneId
}, -10)

const quest = new Quest(
  noGroup.place('restoreInventory').name(i18nShared`Вернуть вещи`),
  i18n`Верните вещи после смерти!`,
  (q, player) => {
    const { deadAt2, gravestoneId } = player.database.survival
    if (!gravestoneId) return q.failed(i18n.error`Могила была удалена очисткой мусора.`, true)
    if (!deadAt2) return q.failed(i18n.error`Ваше место смерти потерялось!`, true)

    q.dynamic(Vec.string(deadAt2.location, true))
      .description(
        i18n`Верните свои вещи${
          player.database.survival.newbie ? i18n`, никто кроме вас их забрать не может` : ''
        }, они ждут вас на ${Vec.string(deadAt2.location, true)}§6!`,
      )
      .activate(ctx => {
        ctx.target = deadAt2
        ctx.world.afterEvents.playerInteractWithEntity.subscribe(event => {
          if (event.player.id !== player.id) return
          if (gravestoneGetOwner(event.target) !== player.id) return

          ctx.next()
        })
        ctx.subscribe(onGravestoneRemove, ({ ownerId }) => {
          if (ownerId !== player.id) return

          player.fail(i18n.error`Могила исчезла...`)
          ctx.next()
        })
      })

    q.end(() => {
      player.success(i18n`Поздравляем! В будущем постарайтесь быть осторожнее.`)
    })
  },
)

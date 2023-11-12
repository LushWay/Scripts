import {
  ItemStack,
  MolangVariableMap,
  Player,
  Vector,
  system,
  world,
} from '@minecraft/server'
import {
  MinecraftBlockTypes,
  MinecraftItemTypes,
} from '@minecraft/vanilla-data.js'
import { LockAction, XCommand } from 'xapi.js'
import { RadiusRegion, Region } from '../../Server/Region/Region.js'
import { MoneyCost, Store } from '../../Server/Server/store.js'
import { baseMenu } from './baseMenu.js'

export const BASE_ITEM_STACK = new ItemStack(MinecraftItemTypes.Barrel)
BASE_ITEM_STACK.setLore(['Поставьте эту бочку', 'и она станет базой.'])

new Store({ x: -234, y: 65, z: -74 }, 'overworld').addItem(
  BASE_ITEM_STACK,
  new MoneyCost(10)
)

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { player, block, faceLocation, itemStack } = event
  if (!itemStack.isStackableWith(BASE_ITEM_STACK) || LockAction.locked(player))
    return

  const region = RadiusRegion.regions.find(e =>
    e.permissions.owners.includes(player.id)
  )

  if (region) {
    const isOwner = region.permissions.owners[0] === player.id
    event.cancel = true
    return player.tell(
      `§cВы уже ${
        isOwner
          ? 'владеете базой'
          : `состоите в базе игрока '${Player.name(
              region.permissions.owners[0]
            )}'`
      }!`
    )
  }

  const nearRegion = Region.regions.find(r => {
    if (r instanceof RadiusRegion) {
      return Vector.distance(r.center, block.location) < r.radius + 100
    } else {
      const from = { x: r.from.x, y: 0, z: r.from.z }
      const to = { x: r.to.x, y: 0, z: r.to.z }

      const min = Vector.min(from, to)
      const max = Vector.max(from, to)

      const size = 30
      block.location.y

      return Vector.between(
        Vector.add(min, { x: -size, y: 0, z: -size }),
        Vector.add(max, { x: size, y: 0, z: size }),
        { x: block.x, y: 0, z: block.z }
      )
    }
  })

  if (nearRegion) {
    event.cancel = true
    return player.tell('§cРядом есть другие регионы!')
  }

  system.run(() => {
    new RadiusRegion(
      Vector.floor(Vector.add(block.location, faceLocation)),
      30,
      block.dimension.type,
      {
        doorsAndSwitches: false,
        openContainers: false,
        pvp: true,
        allowedEntitys: 'all',
        owners: [player.id],
      }
    )
    player.tell(
      '§a► §fБаза успешно создана! Чтобы открыть меню базы используйте команду §6-base'
    )
    player.playSound('random.levelup')
  })
})

const base = new XCommand({
  name: 'base',
  description: 'Меню базы',
})
base.executes(ctx => {
  if (LockAction.locked(ctx.sender)) return
  const base = RadiusRegion.regions.find(e =>
    e.permissions.owners.includes(ctx.sender.id)
  )

  if (!base)
    return ctx.reply(
      '§cУ вас нет базы! Вступите в существующую или создайте свою.'
    )

  baseMenu(ctx.sender, base)
})

system.runInterval(
  () => {
    const playersLocations = world.getAllPlayers().map(p => {
      return { dimension: p.dimension.type, loc: p.location }
    })

    for (const base of RadiusRegion.regions.filter(
      // Ensure that region is a base (enabled pvp)
      e => e.permissions.pvp
    )) {
      const block = world[base.dimensionId].getBlock(Vector.floor(base.center))
      if (!block) continue
      if (block.typeId === MinecraftBlockTypes.Barrel) {
        if (
          playersLocations.find(
            e =>
              e.dimension === base.dimensionId &&
              Vector.distance(base.center, e.loc) < 10
          )
        )
          world[base.dimensionId].spawnParticle(
            'minecraft:endrod',
            Vector.add(base.center, { x: 0.5, y: 1.5, z: 0.5 }),
            new MolangVariableMap()
          )

        continue
      }

      base.forEachOwner(player => {
        player.tell(
          `§cБаза с владельцем §f${Player.name(player.id)}§c разрушена.`
        )
      })
      base.delete()
    }
  },
  'baseInterval',
  10
)

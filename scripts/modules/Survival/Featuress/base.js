import { ItemStack, LocationInUnloadedChunkError, Vector, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config.js'
import { MoneyCost, Store } from 'lib/Class/Store.js'
import { baseMenu } from 'modules/Survival/Featuress/baseMenu.js'
import { INTERACTION_GUARD } from 'modules/Survival/config.js'
import { spawnParticlesInArea } from 'modules/WorldEdit/config.js'
import { BaseRegion, CubeRegion, LockAction, RadiusRegion, Region } from 'smapi.js'

export const BASE_ITEM_STACK = new ItemStack(MinecraftItemTypes.Barrel).setInfo(
  '§r§6База',
  '§7Поставьте эту бочку и она стане базой.'
)

new Store({ x: 88, y: 77, z: 13450 }, 'overworld').addItem(BASE_ITEM_STACK, new MoneyCost(10))

INTERACTION_GUARD.subscribe((_, __, ctx) => {
  if ((ctx.type === 'interactWithBlock' || ctx.type === 'place') && ctx.event.itemStack?.is(BASE_ITEM_STACK))
    return true
})

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { player, block, faceLocation, itemStack } = event
  if (!itemStack.isStackableWith(BASE_ITEM_STACK) || LockAction.locked(player)) return

  const region = Region.regionInstancesOf(RadiusRegion).find(e => e.regionMember(player) !== false)

  if (region) {
    event.cancel = true
    return player.tell(
      `§cВы уже ${
        region.regionMember(player) === 'owner' ? 'владеете базой' : `состоите в базе игрока '${region.ownerName}'`
      }!`
    )
  }

  const nearRegion = Region.regions.find(r => {
    if (r instanceof RadiusRegion) {
      return Vector.distance(r.center, block.location) < r.radius + 50
    } else if (r instanceof CubeRegion) {
      const from = { x: r.from.x, y: 0, z: r.from.z }
      const to = { x: r.to.x, y: 0, z: r.to.z }

      const min = Vector.min(from, to)
      const max = Vector.max(from, to)

      const size = 30
      block.location.y

      return Vector.between(
        Vector.add(min, { x: -size, y: 0, z: -size }),
        Vector.add(max, { x: size, y: 0, z: size }),
        {
          x: block.x,
          y: 0,
          z: block.z,
        }
      )
    }
  })

  if (nearRegion) {
    event.cancel = true
    return player.tell('§cРядом есть другие регионы!')
  }

  system.delay(() => {
    new BaseRegion({
      center: Vector.floor(Vector.add(block.location, faceLocation)),
      radius: 30,
      dimensionId: block.dimension.type,
      permissions: {
        doorsAndSwitches: false,
        openContainers: false,
        pvp: true,
        allowedEntities: 'all',
        owners: [player.id],
      },
    })
    player.tell('§a► §fБаза успешно создана! Чтобы открыть меню базы используйте команду §6-base')
    player.playSound(SOUNDS.levelup)
  })
})

const base = new Command({
  name: 'base',
  description: 'Меню базы',
})
base.executes(ctx => {
  if (LockAction.locked(ctx.sender)) return
  const base = Region.regionInstancesOf(BaseRegion).find(r => r.regionMember(ctx.sender))

  if (!base) return ctx.reply('§cУ вас нет базы! Вступите в существующую или создайте свою.')

  baseMenu(ctx.sender, base)
})

system.runInterval(
  () => {
    const playersLocations = world.getAllPlayers().map(p => {
      return { dimension: p.dimension.type, loc: p.location }
    })

    for (const base of Region.regionInstancesOf(BaseRegion)) {
      let block
      try {
        block = world[base.dimensionId].getBlock(Vector.floor(base.center))
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) continue
        else throw e
      }

      if (!block) continue
      if (block.typeId === MinecraftBlockTypes.Barrel) {
        if (playersLocations.find(e => e.dimension === base.dimensionId && Vector.distance(base.center, e.loc) < 10)) {
          spawnParticlesInArea(base.center, Vector.add(base.center, Vector.one))
        }
      } else {
        base.forEachOwner(player => {
          player.tell(`§cБаза с владельцем §f${base.ownerName}§c разрушена.`)
        })
        base.delete()
      }
    }
  },
  'baseInterval',
  10
)

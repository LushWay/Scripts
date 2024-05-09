import { ItemStack, Vector, system, world } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { BaseRegion, CubeRegion, LockAction, RadiusRegion, Region, blockStatus, util } from 'lib'
import { actionGuard } from 'lib/region/index'
import { openBaseMenu } from 'modules/Features/baseMenu'
import { spawnParticlesInArea } from 'modules/WorldEdit/config'

export const BASE_ITEM_STACK = new ItemStack(MinecraftItemTypes.Barrel).setInfo(
  '§r§6База',
  '§7Поставьте эту бочку и она стане базой.',
)

// new Store({ x: 88, y: 77, z: 13450 }, 'overworld').addItem(BASE_ITEM_STACK, new ScoreboardCost(10))

actionGuard((_, __, ctx) => {
  if ((ctx.type === 'interactWithBlock' || ctx.type === 'place') && ctx.event.itemStack?.is(BASE_ITEM_STACK))
    return true
})

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { player, block, faceLocation, itemStack } = event
  try {
    if (!itemStack.isStackableWith(BASE_ITEM_STACK) || LockAction.locked(player)) return
  } catch (e) {
    if (e instanceof TypeError && e.message.match(/native handle/)) return
    return util.error(e)
  }

  const region = Region.regionInstancesOf(RadiusRegion).find(e => e.getMemberRole(player) !== false)

  if (region) {
    event.cancel = true
    return player.fail(
      `§cВы уже ${
        region.getMemberRole(player) === 'owner' ? 'владеете базой' : `состоите в базе игрока '${region.ownerName}'`
      }!`,
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
        },
      )
    }
  })

  if (nearRegion) {
    event.cancel = true
    return player.fail('§cРядом есть другие регионы!')
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
    player.success('База успешно создана! Чтобы открыть меню базы используйте команду §6-base')
  })
})

const base = new Command('base').setDescription('Меню базы')
base.executes(ctx => {
  openBaseMenu(ctx.player)
})

system.runInterval(
  () => {
    const playersLocations = world.getAllPlayers().map(p => {
      return { dimension: p.dimension.type, loc: p.location }
    })

    for (const base of Region.regionInstancesOf(BaseRegion)) {
      const block = blockStatus({ location: base.center, dimensionId: base.dimensionId })
      if (!block || block === 'unloaded') continue
      if (block.typeId === MinecraftBlockTypes.Barrel) {
        if (playersLocations.find(e => e.dimension === base.dimensionId && Vector.distance(base.center, e.loc) < 10)) {
          spawnParticlesInArea(base.center, Vector.add(base.center, Vector.one))
        }
      } else {
        base.forEachOwner(player => {
          player.fail(`§cБаза с владельцем §f${base.ownerName}§c разрушена.`)
        })

        base.delete()
      }
    }
  },
  'baseInterval',
  10,
)

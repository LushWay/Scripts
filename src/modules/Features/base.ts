import { ItemStack, Vector, system, world } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { BaseRegion, CubeRegion, LockAction, RadiusRegion, Region, blockStatus, util } from 'lib'
import { actionGuard } from 'lib/Region/index'
import { openBaseMenu } from 'modules/Features/baseMenu'
import { spawnParticlesInArea } from 'modules/WorldEdit/config'

export const BASE_ITEM_STACK = new ItemStack(MinecraftItemTypes.Barrel).setInfo(
  '§r§6База',
  '§7Поставьте эту бочку и она стане базой.',
)

// new Store({ x: 88, y: 77, z: 13450 }, 'overworld').addItem(BASE_ITEM_STACK, new ScoreboardCost(10))

// @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
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

  // @ts-expect-error TS(2339) FIXME: Property 'getMemberRole' does not exist on type 'n... Remove this comment to see the full error message
  const region = Region.regionInstancesOf(RadiusRegion).find(e => e.getMemberRole(player) !== false)

  if (region) {
    event.cancel = true
    return player.fail(
      `§cВы уже ${
        // @ts-expect-error TS(2339) FIXME: Property 'getMemberRole' does not exist on type 'n... Remove this comment to see the full error message
        region.getMemberRole(player) === 'owner' ? 'владеете базой' : `состоите в базе игрока '${region.ownerName}'`
      }!`,
    )
  }

  const nearRegion = Region.regions.find(r => {
    // @ts-expect-error TS(2358) FIXME: The left-hand side of an 'instanceof' expression m... Remove this comment to see the full error message
    if (r instanceof RadiusRegion) {
      // @ts-expect-error TS(2339) FIXME: Property 'center' does not exist on type 'never'.
      return Vector.distance(r.center, block.location) < r.radius + 50
      // @ts-expect-error TS(2358) FIXME: The left-hand side of an 'instanceof' expression m... Remove this comment to see the full error message
    } else if (r instanceof CubeRegion) {
      // @ts-expect-error TS(2339) FIXME: Property 'from' does not exist on type 'never'.
      const from = { x: r.from.x, y: 0, z: r.from.z }

      // @ts-expect-error TS(2339) FIXME: Property 'to' does not exist on type 'never'.
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

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
const base = new Command('base').setDescription('Меню базы')
base.executes(ctx => {
  // @ts-expect-error TS(2554) FIXME: Expected 2-3 arguments, but got 1.
  openBaseMenu(ctx.player)
})

system.runInterval(
  () => {
    const playersLocations = world.getAllPlayers().map(p => {
      return { dimension: p.dimension.type, loc: p.location }
    })

    for (const base of Region.regionInstancesOf(BaseRegion)) {
      // @ts-expect-error TS(2339) FIXME: Property 'center' does not exist on type 'never'.
      const block = blockStatus({ location: base.center, dimensionId: base.dimensionId })
      if (!block || block === 'unloaded') continue
      if (block.typeId === MinecraftBlockTypes.Barrel) {
        // @ts-expect-error TS(2339) FIXME: Property 'dimensionId' does not exist on type 'nev... Remove this comment to see the full error message
        if (playersLocations.find(e => e.dimension === base.dimensionId && Vector.distance(base.center, e.loc) < 10)) {
          // @ts-expect-error TS(2339) FIXME: Property 'center' does not exist on type 'never'.
          spawnParticlesInArea(base.center, Vector.add(base.center, Vector.one))
        }
      } else {
        // @ts-expect-error TS(2339) FIXME: Property 'forEachOwner' does not exist on type 'ne... Remove this comment to see the full error message
        base.forEachOwner(player => {
          // @ts-expect-error TS(2339) FIXME: Property 'ownerName' does not exist on type 'never... Remove this comment to see the full error message
          player.fail(`§cБаза с владельцем §f${base.ownerName}§c разрушена.`)
        })

        // @ts-expect-error TS(2339) FIXME: Property 'delete' does not exist on type 'never'.
        base.delete()
      }
    }
  },
  'baseInterval',
  10,
)

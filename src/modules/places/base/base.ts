import { system, world } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { BaseRegion, CubeRegion, LockAction, RadiusRegion, Region, Vector, getBlockStatus } from 'lib'
import { actionGuard } from 'lib/region/index'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { openBaseMenu } from 'modules/places/base/base-menu'
import { spawnParticlesInArea } from 'modules/world-edit/config'

export const BaseItem = new CustomItemWithBlueprint('base')
  .typeId(MinecraftItemTypes.Barrel)
  .nameTag('§6База')
  .lore('Поставьте эту бочку и она станет базой.')

actionGuard((_, __, ctx) => {
  if (
    (ctx.type === 'interactWithBlock' || ctx.type === 'place') &&
    BaseItem.isItem(ctx.event.player.mainhand().getItem())
  )
    return true
})

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { player, block } = event
  const mainhand = player.mainhand()
  try {
    if (!BaseItem.isItem(mainhand.getItem()) || LockAction.locked(player)) return
  } catch (e) {
    if (e instanceof TypeError && e.message.match(/native handle/)) return
    return console.error(e)
  }

  const region = Region.regionInstancesOf(BaseRegion).find(e => e.getMemberRole(player) !== false)

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
      const { from, to } = r.edges

      const min = Vector.min(from, to)
      const max = Vector.max(from, to)

      const size = 30

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
    const center = Vector.floor(block.location)
    if (!player.isSimulated()) console.log(player.name + ' created a base on ' + Vector.string(center, true))
    BaseRegion.create({
      center: center,
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
    player.success('База успешно создана! Чтобы открыть меню базы используйте команду §6.base')
  })
})

const base = new Command('base').setDescription('Меню базы').executes(ctx => {
  openBaseMenu(ctx.player)
})

base
  .overload('getitem')
  .setPermissions('techAdmin')
  .setDescription('Выдает предмет базы')
  .executes(ctx => {
    ctx.player.container?.addItem(BaseItem.itemStack)
    ctx.reply('База выдана')
  })

system.runInterval(
  () => {
    const playersLocations = world.getAllPlayers().map(p => {
      return { dimension: p.dimension.type, loc: p.location }
    })

    for (const base of Region.regionInstancesOf(BaseRegion)) {
      const block = getBlockStatus({ location: base.center, dimensionId: base.dimensionId })
      if (block === 'unloaded') continue

      if (block.typeId === MinecraftBlockTypes.Barrel) {
        if (playersLocations.find(e => e.dimension === base.dimensionId && Vector.distance(base.center, e.loc) < 10)) {
          spawnParticlesInArea(base.center, Vector.add(base.center, Vector.one))
        }
      } else {
        base.forEachOwner(player => player.fail(`§cБаза с владельцем §f${base.ownerName}§c разрушена.`))
        base.delete()
      }
    }
  },
  'baseInterval',
  10,
)

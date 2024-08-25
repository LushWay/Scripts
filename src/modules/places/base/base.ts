import { Block, Player, system, world } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { LockAction, Region, Vector, getBlockStatus } from 'lib'
import { SphereArea } from 'lib/region/areas/sphere'
import { actionGuard } from 'lib/region/index'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { openBaseMenu } from 'modules/places/base/base-menu'
import { askForExitingNewbieMode, isNewbie } from 'modules/pvp/newbie'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { BaseRegion } from './region'

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
    if (!BaseItem.isItem(mainhand.getItem())) return
    if (LockAction.locked(player)) return (event.cancel = true)
  } catch (e) {
    if (e instanceof TypeError && e.message.includes('native handle')) return
    return console.error(e)
  }

  if (isNewbie(player)) {
    event.cancel = true
    return system.delay(() =>
      askForExitingNewbieMode(player, 'решили создать базу', () =>
        player.success('Теперь вы можете свободно создать базу!'),
      ),
    )
  }

  const region = BaseRegion.instances().find(e => e.getMemberRole(player) !== false)

  if (region) {
    event.cancel = true
    const isOwner = region.getMemberRole(player) === 'owner'
    return player.fail(`§cВы уже ${isOwner ? 'владеете базой' : `состоите в базе игрока '${region.ownerName}'`}!`)
  }

  const isThereNearRegions = Region.regions.some(r => r.area.isNear(block, 50))
  if (isThereNearRegions) {
    event.cancel = true
    return player.fail('§cРядом есть другие регионы!')
  }

  system.delay(() => createBase(block, player))
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
    ctx.player.success()
  })

system.runInterval(
  () => {
    const playersLocations = world.getAllPlayers().map(p => ({ d: p.dimension.type, l: p.location }))

    for (const base of BaseRegion.instances()) {
      const block = getBlockStatus({ location: base.area.center, dimensionId: base.dimensionId })
      if (block === 'unloaded') continue

      if (block.typeId === MinecraftBlockTypes.Barrel) {
        if (playersLocations.some(p => p.d === base.dimensionId && base.area.isNear(p.l, 10))) {
          spawnParticlesInArea(base.area.center, Vector.add(base.area.center, Vector.one))
        }
      } else {
        // TODO База должна сгнить
        base.forEachOwner(player => player.fail(`§cБаза с владельцем §f${base.ownerName}§c разрушена.`))
        base.delete()
      }
    }
  },
  'baseInterval',
  10,
)

function createBase(block: Block, player: Player) {
  const center = Vector.floor(block.location)
  if (!player.isSimulated()) player.log('Base', 'created a on ' + Vector.string(center, true))
  BaseRegion.create(new SphereArea({ center, radius: 10 }, block.dimension.type), {
    permissions: {
      doors: false,
      switches: false,
      openContainers: false,
      trapdoors: false,
      pvp: true,
      allowedEntities: 'all',
      owners: [player.id],
    },
  })
  player.success('База успешно создана! Чтобы открыть меню базы используйте команду §6.base')
}

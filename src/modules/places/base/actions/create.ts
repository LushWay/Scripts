import { Block, Player, system, world } from '@minecraft/server'
import { actionGuard, ActionGuardOrder, LockAction, Region, Vector } from 'lib'
import { SphereArea } from 'lib/region/areas/sphere'
import { t } from 'lib/text'
import { askForExitingNewbieMode, isNewbie } from 'modules/pvp/newbie'
import { BaseItem, baseLogger } from '../base'
import { baseLevels } from '../base-levels'
import { baseCommand } from '../base-menu'
import { BaseRegion } from '../region'

actionGuard((_, __, ctx) => {
  if (
    (ctx.type === 'interactWithBlock' || ctx.type === 'place') &&
    BaseItem.isItem(ctx.event.player.mainhand().getItem())
  )
    return true
}, ActionGuardOrder.Feature)

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { player, block } = event
  const mainhand = player.mainhand()
  try {
    if (!BaseItem.isItem(mainhand.getItem())) return
    if (BaseRegion.getAt(block)?.getMemberRole(player)) return // Allow restoring base (handled in other place)
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

  const underLimit = 62
  if (block.y < underLimit) {
    return player.fail(t.error`Нельзя создать базу на высоте ниже ${underLimit}!`)
  }

  const region = BaseRegion.getAll().find(e => e.getMemberRole(player))
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

function createBase(block: Block, player: Player) {
  const center = Vector.floor(block.location)
  if (!player.isSimulated()) baseLogger.player(player).info`Created on ${center}`

  const level = baseLevels[1]
  if (!level) throw new TypeError('No level!')

  BaseRegion.create(new SphereArea({ center, radius: level.radius }, block.dimension.type), {
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
  player.success(t`База успешно создана! Чтобы открыть меню базы используйте команду ${baseCommand}`)
}

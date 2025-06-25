import { Block, Player, system, world } from '@minecraft/server'
import { actionGuard, ActionGuardOrder, LockAction, Region, Vec } from 'lib'
import { i18n } from 'lib/i18n/text'
import { SphereArea } from 'lib/region/areas/sphere'
import { askForExitingNewbieMode, isNewbie } from 'lib/rpg/newbie'
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
      askForExitingNewbieMode(player, i18n.warn`решили создать базу`, () =>
        player.success(i18n`Теперь вы можете свободно создать базу!`),
      ),
    )
  }

  const underLimit = 62
  if (block.y < underLimit) {
    event.cancel
    return player.fail(i18n.error`Нельзя создать базу на высоте ниже ${underLimit}!`)
  }

  const region = BaseRegion.getAll().find(e => e.getMemberRole(player))
  if (region) {
    event.cancel = true
    const isOwner = region.getMemberRole(player) === 'owner'
    return player.fail(
      i18n.nocolor`§cВы уже ${isOwner ? i18n`владеете базой` : i18n`состоите в базе игрока '${region.ownerName}'`}!`,
    )
  }

  const nearRegions = Region.getNear(block, 50)
  if (nearRegions.length) {
    event.cancel = true
    return player.fail(i18n.error`Рядом есть другие регионы!`)
  }

  system.delay(() => createBase(block, player))
})

function createBase(block: Block, player: Player) {
  const center = Vec.floor(block.location)
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
  player.success(i18n`База успешно создана! Чтобы открыть меню базы используйте команду ${baseCommand}`)
}

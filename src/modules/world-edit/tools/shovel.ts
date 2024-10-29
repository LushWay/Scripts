import { world } from '@minecraft/server'
import { ModalForm, Vector } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t } from 'lib/text'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { WorldEditTool } from '../lib/world-edit-tool'
import {
  BlocksSetRef,
  blocksSetDropdown,
  getBlocksInSet,
  getReplaceTargets,
  replaceTargetsDropdown,
  replaceWithTargets,
  stringifyBlockWeights,
  toReplaceTarget,
} from '../utils/blocks-set'

export const weShovelTool = new WorldEditTool({
  id: 'shovel',
  name: 'лопата',
  overrides: {
    getMenuButtonName(player) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return (super.getMenuButtonName as WorldEditTool['getMenuButtonName'])(player).replace(/а$/, 'у')
    },
  },
  loreFormat: {
    version: 3,

    blocksSet: ['', ''] as BlocksSetRef,
    replaceBlocksSet: ['', ''] as BlocksSetRef,
    radius: 2,
    height: 1,
    zone: -1,
  },
  itemStackId: Items.WeShovel,

  editToolForm(slot, player) {
    const lore = this.parseLore(slot.getLore())
    new ModalForm('§3Лопата')
      .addSlider('Радиус', 0, 10, 1, lore.radius)
      .addSlider('Высота', 1, 10, 1, lore.height)
      .addSlider('Сдвиг (-1 под ногами, 2 над головой)', -10, 10, 1, lore.zone)

      .addDropdown('Набор блоков', ...blocksSetDropdown(lore.blocksSet, player))
      .addDropdownFromObject('Заменяемый набор блоков', ...replaceTargetsDropdown(lore.replaceBlocksSet, player))
      .show(player, (_, radius, height, zone, blocksSet, replaceBlocksSet) => {
        slot.nameTag = `§r§3Лопата §f${radius} §6${blocksSet}`
        lore.radius = radius
        lore.height = height
        lore.zone = zone

        lore.blocksSet = [player.id, blocksSet]

        if (replaceBlocksSet) lore.replaceBlocksSet = [player.id, replaceBlocksSet]
        else lore.replaceBlocksSet = ['', '']

        slot.setLore(this.stringifyLore(lore))

        player.success(
          t`${lore.blocksSet[0] ? 'Отредактирована' : 'Создана'} лопата с ${blocksSet} набором блоков и радиусом ${radius}`,
        )
      })
  },

  interval10(player, slot) {
    const lore = this.parseLore(slot.getLore(), true)
    if (!lore) return

    const permutations = getBlocksInSet(lore.blocksSet)
    if (!permutations.length)
      return player.onScreenDisplay.setActionBar('§cНабор блоков лопаты пустой!', ActionbarPriority.UrgentNotificiation)

    const replaceTargets = getReplaceTargets(lore.replaceBlocksSet)
    const loc = Vector.floor(player.location)
    const offset = lore.zone
    const pos1 = Vector.add(loc, new Vector(-lore.radius, offset - lore.height, -lore.radius))
    const pos2 = Vector.add(loc, new Vector(lore.radius, offset, lore.radius))

    WorldEdit.forPlayer(player).backup(
      `§eЛопата §7радиус §f${lore.radius} §7высота §f${lore.height} §7сдвиг §f${
        lore.zone
      }\n§7блоки: §f${stringifyBlockWeights(permutations.map(toReplaceTarget))}`,
      pos1,
      pos2,
    )

    for (const vector of Vector.foreach(pos1, pos2)) {
      const block = world.overworld.getBlock(vector)
      if (!block) continue

      replaceWithTargets(replaceTargets, block, permutations)
    }
  },

  onUse(player, item) {
    const lore = item.getLore()
    if (lore[0] === '§aEnabled') {
      lore[0] = '§cDisabled'
    } else lore[0] = '§aEnabled'

    player.onScreenDisplay.setActionBar(lore[0], ActionbarPriority.UrgentNotificiation)
    item.setLore(lore)
  },
})

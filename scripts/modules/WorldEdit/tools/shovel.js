import { Vector, world } from '@minecraft/server'
import { CUSTOM_ITEMS } from 'config.js'
import { ModalForm } from 'lib.js'
import { WorldEdit } from 'modules/WorldEdit/lib/WorldEdit.js'
import { stringifyReplaceTargets, toReplaceTarget } from 'modules/WorldEdit/menu.js'
import { WorldEditTool } from '../lib/WorldEditTool.js'
import { blockSetDropdown, getAllBlockSets, getBlockSet, getBlockSetForReplaceTarget } from '../utils/blocksSet.js'

const shovel = new WorldEditTool({
  name: 'shovel',
  displayName: 'лопата',
  overrides: {
    getMenuButtonName(player) {
      return super.getMenuButtonName(player).replace(/а$/, 'у')
    },
  },
  loreFormat: {
    version: 3,

    /** @type {import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef} */
    blocksSet: ['', ''],

    /** @type {import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef} */
    replaceBlocksSet: ['', ''],
    radius: 2,
    height: 1,
    zone: -1,
  },
  itemStackId: CUSTOM_ITEMS.shovel,
  editToolForm(slot, player) {
    const lore = shovel.parseLore(slot.getLore())
    new ModalForm('§3Лопата')
      .addSlider('Радиус', 0, 10, 1, lore.radius ?? 1)
      .addSlider('Высота', 1, 10, 1, lore.height ?? 1)
      .addSlider('Сдвиг (-1 под ногами, 2 над головой)', -10, 10, 1, lore.zone ?? 1)
      .addDropdown('Набор блоков', ...blockSetDropdown(lore.blocksSet, player))
      .addDropdownFromObject(
        'Заменяемый набор блоков',
        Object.fromEntries(Object.keys(getAllBlockSets(player.id)).map(e => [e, e])),
        {
          defaultValue: lore.replaceBlocksSet[1],
          none: true,
          noneText: 'Любой',
        }
      )
      .show(player, (_, radius, height, zone, blocksSet, replaceBlocksSet) => {
        slot.nameTag = `§r§3Лопата §f${radius} §6${blocksSet}`
        lore.radius = radius
        lore.height = height
        lore.zone = zone
        lore.blocksSet = [player.id, blocksSet]
        if (replaceBlocksSet) lore.replaceBlocksSet = [player.id, replaceBlocksSet]
        else lore.replaceBlocksSet = ['', '']
        slot.setLore(shovel.stringifyLore(lore))

        player.success(
          `${lore.blocksSet ? 'Отредактирована' : 'Создана'} лопата с ${blocksSet} набором блоков и радиусом ${radius}`
        )
      })
  },
  interval10(player, slot) {
    const lore = shovel.parseLore(slot.getLore(), true)
    if (!lore) return

    const blocks = getBlockSet(lore.blocksSet)
    if (!blocks.length) return player.onScreenDisplay.setActionBar('§cНабор блоков лопаты пустой!')

    const replaceBlocks = getBlockSetForReplaceTarget(lore.replaceBlocksSet)
    if (!replaceBlocks.length) return player.onScreenDisplay.setActionBar('§cЗаменяемый набор блоков лопаты пустой!')

    const loc = Vector.floor(player.location)
    const offset = lore.zone
    const pos1 = Vector.add(loc, new Vector(-lore.radius, offset - lore.height, -lore.radius))
    const pos2 = Vector.add(loc, new Vector(lore.radius, offset, lore.radius))

    WorldEdit.forPlayer(player).backup(
      `§eЛопата §7радиус §f${lore.radius} §7высота §f${lore.height} §7сдвиг §f${
        lore.zone
      }\n§7блоки: §f${stringifyReplaceTargets(blocks.map(toReplaceTarget))}`,
      pos1,
      pos2
    )

    for (const loc of Vector.foreach(pos1, pos2)) {
      const block = world.overworld.getBlock(loc)

      for (const replaceBlock of replaceBlocks) {
        if (replaceBlock && !block?.permutation.matches(replaceBlock.typeId, replaceBlock.states)) continue

        block?.setPermutation(blocks.randomElement())
      }
    }
  },
  onUse(player, item) {
    const lore = item.getLore()
    if (lore[0] === '§aEnabled') {
      lore[0] = '§cDisabled'
    } else lore[0] = '§aEnabled'

    player.onScreenDisplay.setActionBar(lore[0])
    item.setLore(lore)
  },
})

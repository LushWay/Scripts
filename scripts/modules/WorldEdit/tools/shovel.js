import { Vector, world } from '@minecraft/server'
import { CUSTOM_ITEMS } from 'config.js'
import { WorldEdit } from 'modules/WorldEdit/class/WorldEdit.js'
import { ModalForm } from 'smapi.js'
import { WorldEditTool } from '../class/Tool.js'
import {
  blockSetDropdown,
  getAllBlockSets,
  getBlockSet,
  getBlockSetForReplaceTarget,
} from '../utils/blocksSet.js'

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
      .addDropdown('Набор блоков', ...blockSetDropdown(lore.blocksSet, player))
      .addDropdownFromObject(
        'Заменяемый набор блоков',
        Object.fromEntries(
          Object.keys(getAllBlockSets(player.id)).map(e => [e, e])
        ),
        {
          defaultValue: lore.replaceBlocksSet[1],
          none: true,
          noneText: 'Любой',
        }
      )
      .show(player, (_, radius, height, blocksSet, replaceBlocksSet) => {
        slot.nameTag = `§r§3Лопата §6${blocksSet}`
        lore.radius = radius
        lore.height = height
        lore.blocksSet = [player.id, blocksSet]
        if (replaceBlocksSet)
          lore.replaceBlocksSet = [player.id, replaceBlocksSet]
        slot.setLore(shovel.stringifyLore(lore))

        player.tell(
          `§a► §r${
            lore.blocksSet ? 'Отредактирована' : 'Создана'
          } лопата с ${blocksSet} набором блоков и радиусом ${radius}`
        )
      })
  },
  interval10(player, slot) {
    const lore = shovel.parseLore(slot.getLore())
    const blocks = getBlockSet(lore.blocksSet)
    if (blocks.length === 0)
      return player.onScreenDisplay.setTitle('§cНабор блоков лопаты пустой!')

    const replaceBlocks = getBlockSetForReplaceTarget(lore.replaceBlocksSet)
    if (blocks.length === 0)
      return player.onScreenDisplay.setTitle(
        '§cЗаменяемый набор блоков лопаты пустой!'
      )

    const loc = Vector.floor(player.location)
    const offset = -1
    const pos1 = Vector.add(
      loc,
      new Vector(-lore.radius, offset - lore.height, -lore.radius)
    )
    const pos2 = Vector.add(loc, new Vector(lore.radius, offset, lore.radius))

    WorldEdit.forPlayer(player).backup(pos1, pos2)

    for (const loc of Vector.foreach(pos1, pos2)) {
      const block = world.overworld.getBlock(loc)

      for (const replaceBlock of replaceBlocks) {
        if (
          replaceBlock &&
          !block?.permutation.matches(replaceBlock.typeId, replaceBlock.states)
        )
          continue

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

import { Vector, world } from '@minecraft/server'
import { WorldEdit } from 'modules/Development/WorldEdit/class/WorldEdit.js'
import { ModalForm } from 'xapi.js'
import { WorldEditTool } from '../class/Tool.js'
import {
  blockSetDropdown,
  getAllBlockSets,
  getBlockSet,
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
    version: 2,

    blocksSet: '',
    replaceBlocksSet: '',
    radius: 2,
    height: 1,
    zone: -1,
  },
  itemStackId: 'we:shovel',
  editToolForm(slot, player) {
    const lore = shovel.parseLore(slot.getLore())
    new ModalForm('§3Лопата')
      .addSlider('Радиус', 1, 10, 1, lore.radius ?? 1)
      .addSlider('Высота', 1, 10, 1, lore.height ?? 1)
      .addDropdown('Набор блоков', ...blockSetDropdown(player, lore.blocksSet))
      .addDropdownFromObject(
        'Заменяемый набор блоков',
        Object.fromEntries(
          Object.keys(getAllBlockSets(player)).map(e => [e, e])
        ),
        { defaultValue: lore.replaceBlocksSet, none: true, noneText: 'Любой' }
      )
      .show(player, (_, radius, height, blocksSet, replaceBlocksSet) => {
        slot.nameTag = `§r§3Лопата §6${blocksSet}`
        lore.radius = radius
        lore.height = height
        lore.blocksSet = blocksSet
        if (replaceBlocksSet) lore.replaceBlocksSet = replaceBlocksSet
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
    const blocks = getBlockSet(player, lore.blocksSet)
    const replaceBlocks = lore.replaceBlocksSet
      ? getBlockSet(player, lore.replaceBlocksSet)
      : [undefined]
    const loc = Vector.floor(player.location)
    const offset = -1
    const pos1 = Vector.add(
      loc,
      new Vector(-lore.radius, offset - lore.height, -lore.radius)
    )
    const pos2 = Vector.add(loc, new Vector(lore.radius, offset, lore.radius))

    WorldEdit.forPlayer(player).backup(pos1, pos2)

    for (const loc of Vector.foreach(pos1, pos2)) {
      for (const replaceBlock of replaceBlocks) {
        world.overworld.fillBlocks(loc, loc, blocks.randomElement(), {
          matchingBlock: replaceBlock,
        })
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

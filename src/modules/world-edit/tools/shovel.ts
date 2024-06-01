import { world } from '@minecraft/server'
import { ModalForm, Vector } from 'lib'
import { CustomItems } from 'lib/assets/config'
import { WorldEdit } from 'modules/world-edit/lib/WorldEdit'
import { stringifyReplaceTargets, toReplaceTarget } from 'modules/world-edit/menu'
import { WorldEditTool } from '../lib/WorldEditTool'
import {
  BlocksSetRef,
  blocksSetDropdown,
  getAllBlocksSets,
  getBlocksSetByRef,
  getBlocksSetForReplaceTarget,
} from '../utils/blocksSet'

const shovel = new WorldEditTool({
  name: 'shovel',
  displayName: 'лопата',
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
  itemStackId: CustomItems.WeShovel,

  editToolForm(slot, player) {
    const lore = shovel.parseLore(slot.getLore())
    new ModalForm('§3Лопата')
      .addSlider('Радиус', 0, 10, 1, lore.radius ?? 1)
      .addSlider('Высота', 1, 10, 1, lore.height ?? 1)
      .addSlider('Сдвиг (-1 под ногами, 2 над головой)', -10, 10, 1, lore.zone ?? 1)

      .addDropdown('Набор блоков', ...blocksSetDropdown(lore.blocksSet, player))
      .addDropdownFromObject(
        'Заменяемый набор блоков',
        Object.fromEntries(Object.keys(getAllBlocksSets(player.id)).map(e => [e, e])),
        {
          defaultValue: lore.replaceBlocksSet[1],
          none: true,
          noneText: 'Любой',
        },
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
          `${lore.blocksSet[0] ? 'Отредактирована' : 'Создана'} лопата с ${blocksSet} набором блоков и радиусом ${radius}`,
        )
      })
  },

  interval10(player, slot) {
    const lore = shovel.parseLore(slot.getLore(), true)
    if (!lore) return

    const blocks = getBlocksSetByRef(lore.blocksSet)
    if (!blocks.length) return player.onScreenDisplay.setActionBar('§cНабор блоков лопаты пустой!')

    const replaceBlocks = getBlocksSetForReplaceTarget(lore.replaceBlocksSet)
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
      pos2,
    )

    for (const loc of Vector.foreach(pos1, pos2)) {
      const block = world.overworld.getBlock(loc)

      if (!block) continue

      for (const replaceBlock of replaceBlocks) {
        if (!block.permutation.matches(replaceBlock.typeId)) continue
        const states = block.permutation.getAllStates()

        for (const [name, value] of Object.entries(replaceBlock.states)) {
          if (states[name] !== value) continue
        }

        block.setPermutation(blocks.randomElement())
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

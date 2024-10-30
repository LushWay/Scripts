import { ContainerSlot, ItemStack, Player, world } from '@minecraft/server'
import { ModalForm, Vector } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t } from 'lib/text'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { WorldEditTool, WorldEditToolInterval } from '../lib/world-edit-tool'
import { skipForBlending } from '../utils/blending'
import {
  BlocksSetRef,
  blocksSetDropdown,
  getBlocksInSet,
  getReplaceMode,
  getReplaceTargets,
  replaceModeDropdown,
  replaceTargetsDropdown,
  replaceWithTargets,
  stringifyBlockWeights,
  toReplaceTarget,
} from '../utils/blocks-set'

interface Storage {
  version: number
  blocksSet: BlocksSetRef
  replaceBlocksSet: BlocksSetRef
  replaceMode: string
  radius: number
  height: number
  offset: number
  blending: number
  factor: number
}

class ShovelTool extends WorldEditTool<Storage> {
  id = 'shovel'
  name = 'лопата'
  typeId = Items.WeShovel
  storageSchema = {
    version: 4,

    blocksSet: ['', ''] as BlocksSetRef,
    replaceBlocksSet: ['', ''] as BlocksSetRef,
    replaceMode: '',
    radius: 2,
    height: 1,
    offset: -1,
    blending: -1,
    factor: 20,
  }

  getMenuButtonName(player: Player) {
    return super.getMenuButtonName(player).replace(/а$/, 'у')
  }

  editToolForm(slot: ContainerSlot, player: Player) {
    const storage = this.getStorage(slot)
    new ModalForm('§3Лопата')
      .addSlider('Радиус', 0, 10, 1, storage.radius)
      .addSlider('Высота', 1, 10, 1, storage.height)
      .addSlider('Сдвиг (-1 под ногами, 2 над головой)', -10, 10, 1, storage.offset)

      .addDropdown('Набор блоков', ...blocksSetDropdown(storage.blocksSet, player))
      .addDropdown('Заменяемый набор блоков', ...replaceTargetsDropdown(storage.replaceBlocksSet, player))
      .addDropdown('Режим замены', ...replaceModeDropdown(storage.replaceMode))
      .addSlider(
        'Смешивание с окрущающими блоками\n(-1 чтобы отключить, 0 чтобы сделать площадь круглой)',
        -1,
        9,
        1,
        storage.blending,
      )
      .addSlider('Сила смешивания', 0, 100, 1, storage.factor)
      .show(player, (_, radius, height, offset, blocksSet, replaceBlocksSet, replaceMode, blending, factor) => {
        slot.nameTag = `§r§3Лопата §f${radius} §6${blocksSet}`
        storage.radius = radius
        storage.height = height
        storage.offset = offset
        storage.replaceMode = replaceMode ?? ''
        storage.blending = Math.min(radius, blending)
        storage.factor = factor

        storage.blocksSet = [player.id, blocksSet]

        if (replaceBlocksSet) storage.replaceBlocksSet = [player.id, replaceBlocksSet]
        else storage.replaceBlocksSet = ['', '']

        this.saveStorage(slot, storage)

        player.success(
          t`${storage.blocksSet[0] ? 'Отредактирована' : 'Создана'} лопата с ${blocksSet} набором блоков и радиусом ${radius}`,
        )
      })
  }

  interval10: WorldEditToolInterval<this> = (player, slot) => {
    const lookingUp = Math.round(player.getRotation().x) === -90
    if (lookingUp) return

    const storage = this.getStorage(slot, true)
    if (!storage) return

    const permutations = getBlocksInSet(storage.blocksSet)
    if (!permutations.length)
      return player.onScreenDisplay.setActionBar('§cНабор блоков лопаты пустой!', ActionbarPriority.UrgentNotificiation)

    const { offset, radius, height } = storage
    const replaceTargets = getReplaceTargets(storage.replaceBlocksSet)
    const center = Vector.floor(player.location)
    const from = Vector.add(center, new Vector(-radius, offset - height, -radius))
    const to = Vector.add(center, new Vector(radius, offset, radius))

    WorldEdit.forPlayer(player).backup(
      `§eЛопата §7радиус §f${radius} §7высота §f${height} §7сдвиг §f${
        offset
      }\n§7блоки: §f${stringifyBlockWeights(permutations.map(toReplaceTarget))}`,
      from,
      to,
    )

    for (const vector of Vector.foreach(from, to)) {
      if (skipForBlending(storage, { vector, center })) continue

      const block = world.overworld.getBlock(vector)
      if (!block) continue

      replaceWithTargets(replaceTargets, getReplaceMode(storage.replaceMode), block, permutations)
    }
  }

  onUse(player: Player, item: ItemStack) {
    const lore = item.getLore()
    if (lore[0] === '§aEnabled') {
      lore[0] = '§cDisabled'
    } else lore[0] = '§aEnabled'

    player.onScreenDisplay.setActionBar(lore[0], ActionbarPriority.UrgentNotificiation)
    item.setLore(lore)
  }
}

export const weShovelTool = new ShovelTool()

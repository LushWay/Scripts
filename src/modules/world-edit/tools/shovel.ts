import { ContainerSlot, ItemStack, Player, world } from '@minecraft/server'
import { ModalForm, Vec } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n } from 'lib/i18n/text'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { WorldEditTool } from '../lib/world-edit-tool'
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

enum Activator {
  OnUse = 'use',
  Interval0 = 'i0',
  Interval10 = 'i10',
  Interval20 = 'i20',
}

const activator: Record<Activator, string> = {
  [Activator.Interval0]: 'Раз в тик',
  [Activator.Interval10]: 'Раз в пол секунды',
  [Activator.Interval20]: 'Раз в секунду',
  [Activator.OnUse]: 'При использовании',
}

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
  activator: Activator
}

class ShovelTool extends WorldEditTool<Storage> {
  id = 'shovel'
  name = 'лопата'
  typeId = Items.WeShovel
  storageSchema = {
    version: 5,

    blocksSet: ['', ''] as BlocksSetRef,
    replaceBlocksSet: ['', ''] as BlocksSetRef,
    replaceMode: '',
    radius: 2,
    height: 1,
    offset: -1,
    blending: -1,
    factor: 20,
    activator: Activator.Interval10,
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
      .addDropdownFromObject('Метод активации', activator, { defaultValueIndex: storage.activator })
      .show(
        player,
        (_, radius, height, offset, blocksSet, replaceBlocksSet, replaceMode, blending, factor, activator) => {
          slot.nameTag = `§r§3Лопата §f${radius} §6${blocksSet}`
          storage.radius = radius
          storage.height = height
          storage.offset = offset
          storage.replaceMode = replaceMode ?? ''
          storage.blending = Math.min(radius, blending)
          storage.factor = factor
          storage.activator = activator

          storage.blocksSet = [player.id, blocksSet]

          if (replaceBlocksSet) storage.replaceBlocksSet = [player.id, replaceBlocksSet]
          else storage.replaceBlocksSet = ['', '']

          this.saveStorage(slot, storage)
          player.success(
            i18n`${storage.blocksSet[0] ? 'Отредактирована' : 'Создана'} лопата с ${blocksSet} набором блоков и радиусом ${radius}`,
          )
        },
      )
  }

  constructor() {
    super()
    this.onGlobalInterval('global', player => {
      const { container } = player
      if (!container) return
      for (const [, item] of container.entries()) {
        if (item?.typeId === this.typeId && this.isLookingUp(player)) {
          const lookingUp = this.isLookingUp(player)
          if (lookingUp)
            return player.onScreenDisplay.setActionBar('Лопата выключена,\nможно настраивать', ActionbarPriority.High)
        }
      }
    })

    this.onInterval(0, (player, storage) => {
      if (storage.activator !== Activator.Interval0) return
      this.run(player, storage)
    })
    this.onInterval(10, (player, storage) => {
      if (storage.activator !== Activator.Interval10) return
      this.run(player, storage)
    })
    this.onInterval(20, (player, storage) => {
      if (storage.activator !== Activator.Interval20) return
      this.run(player, storage)
    })
  }

  onUse(player: Player, _: ItemStack, storage: Storage) {
    if (storage.activator !== Activator.OnUse) return
    this.run(player, storage)
  }

  run(player: Player, storage: Storage) {
    if (this.isLookingUp(player)) return

    const permutations = getBlocksInSet(storage.blocksSet)
    if (!permutations.length)
      return player.onScreenDisplay.setActionBar('§cНабор блоков лопаты пустой!', ActionbarPriority.High)

    const { offset, radius, height } = storage
    const replaceTargets = getReplaceTargets(storage.replaceBlocksSet)
    const center = Vec.floor(player.location)
    const from = Vec.add(center, new Vec(-radius, offset - height, -radius))
    const to = Vec.add(center, new Vec(radius, offset, radius))

    WorldEdit.forPlayer(player).backup(
      `§eЛопата §7радиус §f${radius} §7высота §f${height} §7сдвиг §f${
        offset
      }\n§7блоки: §f${stringifyBlockWeights(permutations.map(toReplaceTarget))}`,
      from,
      to,
    )

    for (const vector of Vec.forEach(from, to)) {
      if (skipForBlending(storage, { vector, center })) continue

      const block = world.overworld.getBlock(vector)
      if (!block) continue

      replaceWithTargets(replaceTargets, getReplaceMode(storage.replaceMode), block, permutations)
    }
  }

  private isLookingUp(player: Player) {
    return Math.round(player.getRotation().x) === -90
  }
}

export const weShovelTool = new ShovelTool()

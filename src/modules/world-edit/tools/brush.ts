import { ContainerSlot, Entity, Player, system, world } from '@minecraft/server'
import { ModalForm, Vec, is, isKeyof, isLocationError } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { Items } from 'lib/assets/custom-items'
import { i18n } from 'lib/i18n/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { Cuboid } from '../../../lib/utils/cuboid'
import { WE_CONFIG } from '../config'
import { WorldEdit } from '../lib/world-edit'
import { WorldEditToolBrush } from '../lib/world-edit-tool-brush'
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
import { shortenBlocksSetName } from '../utils/default-block-sets'
import { SHAPES, ShapeFormula } from '../utils/shapes'

interface Storage {
  shape: string
  blocksSet: BlocksSetRef
  blending: number
  factor: number
}

class BrushTool extends WorldEditToolBrush<Storage> {
  id = 'brush'
  name = 'кисть'
  typeId = Items.WeBrush
  storageSchema = {
    version: 3,

    type: 'brush' as const,
    blocksSet: ['', ''] as BlocksSetRef,
    replaceBlocksSet: ['', ''] as BlocksSetRef,
    replaceMode: '',
    shape: 'Сфера',
    size: 3,
    maxDistance: 300,
    blending: -1,
    factor: 20,
  }

  onBrushUse: WorldEditToolBrush<Storage>['onBrushUse'] = (player, storage, hit) => {
    const shapeName = this.ensureShape(player, storage.shape)
    const size = storage.size
    const center = hit.block.location
    const permutations = getBlocksInSet(storage.blocksSet)
    const replaceTargets = getReplaceTargets(storage.replaceBlocksSet)

    if (permutations.length < 1) return player.fail('§cПустой набор блоков')

    system.runJob(
      (function* brushJob() {
        const from = { x: -size, y: -size, z: -size }
        const to = { x: size, z: size, y: size }

        WorldEdit.forPlayer(player).backup(
          `§3Кисть §6${shapeName}§3, размер §f${size}§3, блоки: §f${stringifyBlockWeights(permutations.map(toReplaceTarget))}`,
          Vec.add(center, from),
          Vec.add(center, to),
        )

        const shape = SHAPES[shapeName]
        const cuboid = new Cuboid(from, to)
        const blendOptions = { ...storage, radius: storage.size }

        let blocksSet = 0
        for (const vector of Vec.forEach(from, to)) {
          const condition = shape(
            Object.setPrototypeOf(
              { rad: size, ...vector } satisfies Omit<Parameters<ShapeFormula>[0], keyof Cuboid>,
              cuboid,
            ) as Parameters<ShapeFormula>[0],
          )
          if (!condition) continue

          const location = Vec.add(center, vector)
          if (skipForBlending(blendOptions, { vector: location, center })) continue

          const block = player.dimension.getBlock(location)
          if (!block) continue

          replaceWithTargets(replaceTargets, getReplaceMode(storage.replaceMode), block, permutations)

          blocksSet++
          if (blocksSet >= WE_CONFIG.BLOCKS_BEFORE_AWAIT) {
            yield
            blocksSet = 0
          }
        }
      })(),
    )
  }

  editToolForm(slot: ContainerSlot, player: Player) {
    const storage = this.getStorage(slot)
    const shapes = Object.keys(SHAPES)

    new ModalForm('§3Кисть')
      .addDropdown('Форма', shapes, { defaultValue: this.ensureShape(player, storage.shape) })
      .addSlider('Размер', 1, is(player.id, 'grandBuilder') ? 20 : 10, 1, storage.size)

      .addDropdown('Набор блоков', ...blocksSetDropdown(storage.blocksSet, player))
      .addDropdown('Заменяемый набор блоков', ...replaceTargetsDropdown(storage.replaceBlocksSet, player))
      .addDropdown('Режим замены', ...replaceModeDropdown(storage.replaceMode))

      .addSlider('Смешивание с окрущающими блоками\n(-1 чтобы отключить)', -1, 9, 1, storage.blending)
      .addSlider('Сила смешивания', 0, 100, 1, storage.factor)

      .show(player, (ctx, shape, radius, blocksSet, replaceBlocksSet, replaceMode, blending, factor) => {
        storage.shape = shape
        storage.size = radius
        storage.factor = factor
        storage.blending = blending
        storage.blocksSet = [player.id, blocksSet]

        if (replaceBlocksSet) storage.replaceBlocksSet = [player.id, replaceBlocksSet]
        else storage.replaceBlocksSet = ['', '']

        storage.replaceMode = replaceMode ?? ''

        slot.nameTag = `§r§3Кисть §6${shape}§r §f${shortenBlocksSetName(blocksSet)}`.slice(0, 254)

        this.saveStorage(slot, storage)
        player.success(
          i18n`${storage.blocksSet[0] ? 'Отредактирована' : 'Создана'} кисть ${shape} с набором блоков ${blocksSet}${
            replaceBlocksSet ? i18n`, заменяемым набором блоков ${replaceBlocksSet}` : ''
          } и радиусом ${radius}`,
        )
      })
  }

  ensureShape(player: Player, shape: string): keyof typeof SHAPES {
    if (!isKeyof(shape, SHAPES)) {
      player.warn(i18n`Неизвестная кисть: ${shape}`)
      return Object.keys(SHAPES)[0] as unknown as keyof typeof SHAPES
    } else return shape
  }

  constructor() {
    super()
    this.createCommand()
      .overload('extrasize')
      .setDescription('Устанавливает размер кисти больше чем лимит в форме')
      .setPermissions('techAdmin')
      .int('Size')
      .executes((ctx, size) => {
        if (isNaN(size)) return ctx.error('Размер не является числом')

        const tool = this.getToolSlot(ctx.player)
        if (typeof tool === 'string') return ctx.error(tool)

        const storage = this.getStorage(tool)
        storage.size = size
        this.saveStorage(tool, storage)
        ctx.player.success()
      })

    world.overworld
      .getEntities({
        type: CustomEntityTypes.FloatingText,
        name: WE_CONFIG.BRUSH_LOCATOR,
      })
      .forEach(e => e.remove())

    this.onGlobalInterval('global', (player, _, slot) => {
      if (slot.typeId !== this.typeId && this.brushLocators.has(player.id)) {
        this.brushLocators.delete(player)
      }
    })

    this.onInterval(0, (player, storage, _, settings) => {
      const hit = player.getBlockFromViewDirection({ maxDistance: storage.maxDistance })

      if (hit && !settings.noBrushParticles) {
        const location = Vec.add(hit.block.location, { x: 0.5, y: 0, z: 0.5 })

        if (!this.brushLocators.has(player.id)) {
          try {
            const entity = player.dimension.spawnEntity<CustomEntityTypes>(CustomEntityTypes.FloatingText, location)
            entity.addTag(player.name)
            entity.nameTag = WE_CONFIG.BRUSH_LOCATOR

            this.brushLocators.set(player.id, entity)
          } catch (error) {
            if (isLocationError(error)) return
            console.error(error)
          }
        } else this.brushLocators.get(player.id)?.teleport(location)
      } else {
        this.brushLocators.delete(player.id)
      }
    })
  }

  brushLocators = new WeakPlayerMap<Entity>({
    onDelete: (_, entity) => entity?.remove(),
  })
}

export const weBrushTool = new BrushTool()

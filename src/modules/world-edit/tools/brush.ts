import {
  Entity,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  world,
} from '@minecraft/server'
import { ModalForm, Vector, is, isKeyof } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { Items } from 'lib/assets/custom-items'
import { t } from 'lib/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { WE_CONFIG } from '../config'
import { WorldEditTool } from '../lib/world-edit-tool'
import { WorldEditToolBrush } from '../lib/world-edit-tool-brush'
import {
  BlocksSetRef,
  blocksSetDropdown,
  getBlocksInSet,
  getReplaceTargets,
  replaceTargetsDropdown,
} from '../utils/blocks-set'
import { SHARED_POSTFIX } from '../utils/default-block-sets'
import { placeShape } from '../utils/shape'
import { SHAPES } from '../utils/shapes'

world.overworld
  .getEntities({
    type: CustomEntityTypes.FloatingText,
    name: WE_CONFIG.BRUSH_LOCATOR,
  })

  .forEach(e => e.remove())

class BrushTool extends WorldEditToolBrush<{ shape: string; blocksSet: BlocksSetRef }> {
  onBrushUse: WorldEditToolBrush<{ shape: string; blocksSet: BlocksSetRef }>['onBrushUse'] = (player, lore, hit) => {
    const error = placeShape(
      player,

      ensureShape(player, lore.shape),
      hit.block.location,
      lore.size,

      getBlocksInSet(lore.blocksSet),
      getReplaceTargets(lore.replaceBlocksSet),
    )

    if (error) player.fail(error)
  }
}

function ensureShape(player: Player, shape: string) {
  if (!isKeyof(shape, SHAPES)) {
    player.warn(t`Неизвестная кисть: ${shape}`)
    return Object.keys(SHAPES)[0]
  } else return shape
}

export const weBrushTool = new BrushTool({
  id: 'brush',
  name: 'кисть',
  itemStackId: Items.WeBrush,
  loreFormat: {
    version: 2,

    blocksSet: ['', ''] as BlocksSetRef,
    replaceBlocksSet: ['', ''] as BlocksSetRef,
    shape: 'Сфера',
    type: 'brush',
    size: 1,
    maxDistance: 300,
  },

  editToolForm(slot, player) {
    const lore = this.parseLore(slot.getLore())
    const shapes = Object.keys(SHAPES)

    new ModalForm('§3Кисть')
      .addDropdown('Форма', shapes, { defaultValue: ensureShape(player, lore.shape) })
      .addSlider('Размер', 1, is(player.id, 'grandBuilder') ? 20 : 10, 1, lore.size)

      .addDropdown('Набор блоков', ...blocksSetDropdown(lore.blocksSet, player))
      .addDropdownFromObject('Заменяемый набор блоков', ...replaceTargetsDropdown(lore.replaceBlocksSet, player))

      .show(player, (ctx, shape, radius, blocksSet, replaceBlocksSet) => {
        lore.shape = shape
        lore.size = radius
        lore.blocksSet = [player.id, blocksSet]

        if (replaceBlocksSet) lore.replaceBlocksSet = [player.id, replaceBlocksSet]
        else lore.replaceBlocksSet = ['', '']
        slot.nameTag = `§r§3Кисть §6${shape}§r §f${blocksSet.replace(SHARED_POSTFIX, '')}`.slice(0, 254)

        slot.setLore(this.stringifyLore(lore))
        player.success(
          t`${lore.blocksSet[0] ? 'Отредактирована' : 'Создана'} кисть ${shape} с набором блоков ${blocksSet}${
            replaceBlocksSet ? t`, заменяемым набором блоков ${replaceBlocksSet}` : ''
          } и радиусом ${radius}`,
        )
      })
  },

  interval0(player, slot, settings) {
    const lore = this.parseLore(slot.getLore())
    const hit = player.getBlockFromViewDirection({
      maxDistance: lore.maxDistance,
    })

    if (hit && !settings.noBrushParticles) {
      const location = Vector.add(hit.block.location, {
        x: 0.5,
        y: 0,
        z: 0.5,
      })

      if (!BRUSH_LOCATORS.has(player.id)) {
        try {
          const entity = player.dimension.spawnEntity(CustomEntityTypes.FloatingText, location)

          entity.addTag(player.name)
          entity.nameTag = WE_CONFIG.BRUSH_LOCATOR

          BRUSH_LOCATORS.set(player.id, entity)
        } catch (error) {
          if (error instanceof LocationOutOfWorldBoundariesError || error instanceof LocationInUnloadedChunkError)
            return

          console.error(error)
        }
      } else BRUSH_LOCATORS.get(player.id)?.teleport(location)
    } else {
      BRUSH_LOCATORS.get(player.id)?.remove()
      BRUSH_LOCATORS.delete(player.id)
    }
  },
})

weBrushTool.command
  .overload('extrasize')
  .setDescription('Устанавливает размер кисти больше чем лимит в форме')
  .setPermissions('techAdmin')
  .int('Size')
  .executes((ctx, size) => {
    if (isNaN(size)) return ctx.error('Размер не является числом')

    const tool = weBrushTool.getToolSlot(ctx.player)
    if (typeof tool === 'string') return ctx.error(tool)

    const lore = weBrushTool.parseLore(tool.getLore())

    lore.size = size

    tool.setLore(weBrushTool.stringifyLore(lore))
    ctx.reply('Успешно')
  })

WorldEditTool.intervals.push((player, slot) => {
  if (slot.typeId !== weBrushTool.itemId && BRUSH_LOCATORS.has(player.id)) {
    BRUSH_LOCATORS.get(player.id)?.remove()
    BRUSH_LOCATORS.delete(player.id)
  }
})

const BRUSH_LOCATORS = new WeakPlayerMap<Entity>()

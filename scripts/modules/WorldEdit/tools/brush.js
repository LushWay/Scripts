import {
  Entity,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  Vector,
  world,
} from '@minecraft/server'
import { CUSTOM_ENTITIES, CUSTOM_ITEMS } from 'config.js'
import { ModalForm, getRole, is, util } from 'lib.js'
import { BaseBrushTool } from '../class/BaseBrushTool.js'
import { WorldEditTool } from '../class/WorldEditTool.js'
import { WE_CONFIG } from '../config.js'
import {
  SHARED_POSTFIX,
  blockSetDropdown,
  getAllBlockSets,
  getBlockSet,
  getBlockSetForReplaceTarget,
} from '../utils/blocksSet.js'
import { placeShape } from '../utils/shape.js'
import { SHAPES } from '../utils/shapes.js'

world.overworld
  .getEntities({
    type: CUSTOM_ENTITIES.floatingText,
    name: WE_CONFIG.BRUSH_LOCATOR,
  })
  .forEach(e => e.remove())

/**
 * @extends {BaseBrushTool<{
 *   shape: string
 *   blocksSet: import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef;
 * }>}
 */
class BrushTool extends BaseBrushTool {
  /**
   *
   * @param {Player} player
   * @param {this["clearLoreFormat"]} lore
   * @param {import('@minecraft/server').BlockRaycastHit} hit
   */
  onBrushUse(player, lore, hit) {
    const error = placeShape(
      player,
      SHAPES[lore.shape],
      hit.block.location,
      lore.size,
      getBlockSet(lore.blocksSet),
      getBlockSetForReplaceTarget(lore.replaceBlocksSet)
    )

    if (error) player.fail(error)
  }
}

const brush = new BrushTool({
  name: 'brush',
  displayName: 'кисть',
  itemStackId: CUSTOM_ITEMS.brush,
  loreFormat: {
    version: 2,

    /** @type {import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef} */
    blocksSet: ['', ''],
    /** @type {import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef} */
    replaceBlocksSet: ['', ''],
    shape: 'Сфера',
    type: 'brush',
    size: 1,
    maxDistance: 300,
  },
  editToolForm(slot, player) {
    const lore = brush.parseLore(slot.getLore())
    const shapes = Object.keys(SHAPES)

    new ModalForm('§3Кисть')
      .addDropdown('Форма', shapes, { defaultValue: lore.shape })
      .addSlider('Размер', 1, is(player.id, 'grandBuilder') ? 20 : 10, 1, lore.size)
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

      .show(player, (ctx, shape, radius, blocksSet, replaceBlocksSet) => {
        lore.shape = shape
        lore.size = radius
        lore.blocksSet = [player.id, blocksSet]
        if (replaceBlocksSet) lore.replaceBlocksSet = [player.id, replaceBlocksSet]
        else lore.replaceBlocksSet = ['', '']
        slot.nameTag = `§r§3Кисть §6${shape}§r §f${blocksSet.replace(SHARED_POSTFIX, '')}`.slice(0, 254)
        slot.setLore(brush.stringifyLore(lore))
        player.success(
          `${lore.blocksSet[0] ? 'Отредактирована' : 'Создана'} кисть ${shape} с набором блоков ${blocksSet}${
            replaceBlocksSet ? `, заменяемым набором блоков ${replaceBlocksSet}` : ''
          } и радиусом ${radius}`
        )
      })
  },
  interval0(player, slot, settings) {
    const lore = brush.parseLore(slot.getLore())
    const hit = player.getBlockFromViewDirection({
      maxDistance: lore.maxDistance,
    })

    if (hit && !settings.noBrushParticles) {
      const location = Vector.add(hit.block.location, {
        x: 0.5,
        y: 0,
        z: 0.5,
      })
      if (!BRUSH_LOCATORS[player.id]) {
        try {
          const entity = player.dimension.spawnEntity(CUSTOM_ENTITIES.floatingText, location)

          entity.addTag(player.name)
          entity.nameTag = WE_CONFIG.BRUSH_LOCATOR
          BRUSH_LOCATORS[player.id] = entity
        } catch (error) {
          if (error instanceof LocationOutOfWorldBoundariesError || error instanceof LocationInUnloadedChunkError)
            return

          util.error(error)
        }
      } else BRUSH_LOCATORS[player.id].teleport(location)
    } else {
      BRUSH_LOCATORS[player.id]?.remove()
      delete BRUSH_LOCATORS[player.id]
    }
  },
})

brush.command
  .literal({ name: 'extrasize', description: 'Устанавливает размер кисти больше чем лимит в форме', role: 'techAdmin' })
  .int('Size')
  .executes((ctx, size) => {
    if (isNaN(size)) return ctx.error('Размер не является числом')

    const tool = brush.getToolSlot(ctx.sender)
    if (typeof tool === 'string') return ctx.error(tool)

    const lore = brush.parseLore(tool.getLore())
    lore.size = size
    tool.setLore(brush.stringifyLore(lore))
    ctx.reply('Успешно')
  })

WorldEditTool.intervals.push((player, slot) => {
  if (slot.typeId !== brush.itemId && BRUSH_LOCATORS[player.id]) {
    BRUSH_LOCATORS[player.id]?.remove()
    delete BRUSH_LOCATORS[player.id]
  }
})

/** @type {Record<string, Entity>} */
const BRUSH_LOCATORS = {}

import {
  Entity,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Vector,
  world,
} from '@minecraft/server'
import { ModalForm, is, util } from 'lib'
import { CUSTOM_ENTITIES, CUSTOM_ITEMS } from 'lib/assets/config'
import { WE_CONFIG } from '../config'
import { BaseBrushTool } from '../lib/BaseBrushTool'
import { WorldEditTool } from '../lib/WorldEditTool'
import {
  SHARED_POSTFIX,
  blockSetDropdown,
  getAllBlockSets,
  getBlockSet,
  getBlockSetForReplaceTarget,
} from '../utils/blocksSet'
import { placeShape } from '../utils/shape'
import { SHAPES } from '../utils/shapes'

world.overworld
  .getEntities({
    type: CUSTOM_ENTITIES.floatingText,
    name: WE_CONFIG.BRUSH_LOCATOR,
  })
  .forEach(e => e.remove())

class BrushTool extends BaseBrushTool {
  onBrushUse(player, lore, hit) {
    const error = placeShape(
      player,

      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      SHAPES[lore.shape],
      hit.block.location,
      lore.size,

      getBlockSet(lore.blocksSet),

      getBlockSetForReplaceTarget(lore.replaceBlocksSet),
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

    /** @type {import('modules/WorldEdit/utils/blocksSet').BlocksSetRef} */

    blocksSet: ['', ''],
    /** @type {import('modules/WorldEdit/utils/blocksSet').BlocksSetRef} */
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
      // @ts-expect-error TS(2556) FIXME: A spread argument must either have a tuple type or... Remove this comment to see the full error message
      .addDropdown('Набор блоков', ...blockSetDropdown(lore.blocksSet, player))
      .addDropdownFromObject(
        'Заменяемый набор блоков',
        Object.fromEntries(Object.keys(getAllBlockSets(player.id)).map(e => [e, e])),
        {
          defaultValue: lore.replaceBlocksSet[1],
          none: true,
          noneText: 'Любой',
        },
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
          } и радиусом ${radius}`,
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

      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      if (!BRUSH_LOCATORS[player.id]) {
        try {
          const entity = player.dimension.spawnEntity(CUSTOM_ENTITIES.floatingText, location)

          entity.addTag(player.name)
          entity.nameTag = WE_CONFIG.BRUSH_LOCATOR

          // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          BRUSH_LOCATORS[player.id] = entity
        } catch (error) {
          if (error instanceof LocationOutOfWorldBoundariesError || error instanceof LocationInUnloadedChunkError)
            return

          util.error(error)
        }
        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      } else BRUSH_LOCATORS[player.id].teleport(location)
    } else {
      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      BRUSH_LOCATORS[player.id]?.remove()

      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      delete BRUSH_LOCATORS[player.id]
    }
  },
})

brush.command
  .overload('extrasize')
  .setDescription('Устанавливает размер кисти больше чем лимит в форме')
  .setPermissions('techAdmin')
  .int('Size')
  .executes((ctx, size) => {
    if (isNaN(size)) return ctx.error('Размер не является числом')

    const tool = brush.getToolSlot(ctx.player)
    if (typeof tool === 'string') return ctx.error(tool)

    const lore = brush.parseLore(tool.getLore())

    lore.size = size

    tool.setLore(brush.stringifyLore(lore))
    ctx.reply('Успешно')
  })

// @ts-expect-error TS(2345) FIXME: Argument of type '(player, slot) => void... Remove this comment to see the full error message
WorldEditTool.intervals.push((player, slot) => {
  // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  if (slot.typeId !== brush.itemId && BRUSH_LOCATORS[player.id]) {
    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    BRUSH_LOCATORS[player.id]?.remove()

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    delete BRUSH_LOCATORS[player.id]
  }
})

/** @type {Record<string, Entity>} */
const BRUSH_LOCATORS = {}

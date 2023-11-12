import { Entity, Vector, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { WE_PLAYER_SETTINGS } from 'modules/Development/WorldEdit/index.js'
import { smoothVoxelData } from 'modules/Development/WorldEdit/tools/smooth.js'
import { ModalForm } from 'xapi.js'
import { WorldEditTool } from '../class/Tool.js'
import { WE_CONFIG } from '../config.js'
import { blockSetDropdown, getBlockSet } from '../utils/blocksSet.js'
import { SHAPES } from '../utils/shapes.js'
import { Shape } from '../utils/utils.js'

const smoother = 'Сглаживание'

world.overworld
  .getEntities({
    type: 'f:t',
    name: WE_CONFIG.BRUSH_LOCATOR,
  })
  .forEach(e => e.remove())

const brush = new WorldEditTool({
  name: 'brush',
  displayName: 'кисть',
  itemStackId: 'we:brush',
  loreFormat: {
    version: 2,

    blocksSet: 'DEFAULT',
    shape: 'Сфера',
    size: 1,
    maxDistance: 300,
  },
  editToolForm(slot, player) {
    const lore = brush.parseLore(slot.getLore())
    const shapes = Object.keys(SHAPES).concat(smoother)

    new ModalForm('§3Кисть')
      .addDropdown('Форма', shapes, { defaultValue: lore.shape })
      .addSlider('Размер', 1, 10, 1, lore.size)
      .addDropdown('Набор блоков', ...blockSetDropdown(player, lore.blocksSet))
      .show(player, (ctx, shape, radius, blocksSet) => {
        lore.shape = shape
        lore.size = radius
        lore.blocksSet = blocksSet
        slot.nameTag = '§r§3Кисть §f' + blocksSet + '§r §6' + shape
        slot.setLore(brush.stringifyLore(lore))
        player.tell(
          `§a► §r${
            lore.blocksSet ? 'Отредактирована' : 'Создана'
          } кисть ${shape} с набором блоков ${blocksSet} и радиусом ${radius}`
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
        const entity = player.dimension.spawnEntity('f:t', location)
        entity.addTag(player.name)
        entity.nameTag = WE_CONFIG.BRUSH_LOCATOR
        BRUSH_LOCATORS[player.id] = entity
      } else BRUSH_LOCATORS[player.id].teleport(location)
    } else {
      BRUSH_LOCATORS[player.id]?.remove()
      delete BRUSH_LOCATORS[player.id]
    }
  },
  onUse(player, item) {
    const settings = WE_PLAYER_SETTINGS(player)
    if (settings.enableMobile) return

    const lore = brush.parseLore(item.getLore())
    const hit = player.getBlockFromViewDirection({
      maxDistance: lore.maxDistance,
    })

    if (!hit) return player.tell('§fКисть > §cБлок слишком далеко.')

    if (lore.shape === smoother) {
      smoothVoxelData(hit.block, lore.size).forEach(e => {
        const block = world.overworld.getBlock(e.location)
        if (e.permutation) block?.setPermutation(e.permutation)
        else block?.setType(MinecraftBlockTypes.Air)
      })
    } else {
      Shape(
        player,
        SHAPES[lore.shape],
        hit.block.location,
        getBlockSet(player, lore.blocksSet),
        lore.size
      )
    }
  },
})

WorldEditTool.intervals.push((player, slot) => {
  if (slot.typeId !== brush.itemId && BRUSH_LOCATORS[player.id]) {
    BRUSH_LOCATORS[player.id]?.remove()
    delete BRUSH_LOCATORS[player.id]
  }
})

/** @type {Record<string, Entity>} */
const BRUSH_LOCATORS = {}

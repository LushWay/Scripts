import { EquipmentSlot, Player } from '@minecraft/server'
import { ActionFormResponse } from '@minecraft/server-ui'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { ActionForm, ModalForm, showForm } from 'xapi.js'
import { ChestFormData } from '../../../../../chestui/forms.js'
import { WorldEditTool } from '../../builders/ToolBuilder.js'

/**
 * @typedef {Record<string, [string, number][]>} BlocksSets
 */

/** @type {DynamicPropertyDB<string, BlocksSets | undefined>} */
const PROPERTY = new DynamicPropertyDB('blockSets')
const DB = PROPERTY.proxy()

/** @type {BlocksSets} */
const defaultBlockSets = {
  'Земля': [[MinecraftBlockTypes.Grass, 0]],
  'Воздух': [[MinecraftBlockTypes.Air, 0]],
  'Пещерный камень': [
    [MinecraftBlockTypes.Stone, 0],
    [MinecraftBlockTypes.Cobblestone, 0],
  ],
  'Каменная стена': [
    [MinecraftBlockTypes.MudBricks, 0],
    [MinecraftBlockTypes.PackedMud, 0],
    [MinecraftBlockTypes.BrickBlock, 0],
    [MinecraftBlockTypes.CobblestoneWall, 2],
    [MinecraftBlockTypes.HardenedClay, 0],
    [MinecraftBlockTypes.Stone, 1],
  ],
}

/**
 * @param {Player} player
 * @returns {BlocksSets}
 */
export function getBlockSets(player) {
  const playerBlockSets = DB[player.id] ?? {}
  return { ...defaultBlockSets, ...playerBlockSets }
}

/**
 * @param {BlocksSets} sets
 * @param {string} name
 */
export function getBlockSet(sets, name) {
  const blocks = sets[name]
  if (!blocks) return []
  return blocks.map(e => e.join('.'))
}

new XCommand({
  name: 'we',
  aliases: ['wb', 'wa'],
  role: 'builder',
  description: 'Открывает меню редактора мира',
}).executes(ctx => WBMenu(ctx.sender))

/**
 * @param {Player} player
 */
function WBMenu(player, body = '') {
  const heldItem = player
    .getComponent('equippable')
    .getEquipmentSlot(EquipmentSlot.Mainhand)
  if (heldItem.typeId) {
    body = `Создание доступно только при пустой руке.` || body
  }

  const form = new ActionForm('§dWorld§6Edit', body).addButton(
    'Наборы блоков',
    () => WBBlocksSets(player)
  )

  for (const tool of WorldEditTool.tools) {
    const buttonName = tool.getMenuButtonName(player)
    if (!buttonName) continue
    form.addButton(buttonName, () => {
      const slotOrError = tool.getToolSlot(player)
      if (typeof slotOrError === 'string') {
        WBMenu(player, '§c' + slotOrError)
      } else {
        tool.editToolForm?.(slotOrError, player)
      }
    })
  }

  form.show(player)
}

/**
 * @param {Player} player
 */
function WBBlocksSets(player) {
  const blockSets = getBlockSets(player)
  const sets = new ActionForm('Наборы блоков')
  sets.addButton('Назад', () => WBMenu(player))
  sets.addButton('Новый набор блоков', 'textures/ui/plus', () => {
    new ModalForm('§3Имя')
      .addTextField(
        `Существующие наборы:\n${Object.keys(blockSets).join(
          '\n'
        )}\n\nВведи новое имя набора`,
        ''
      )
      .show(player, (ctx, name) => {
        if (name in blockSets)
          return ctx.error('Набор с именем ' + name + ' уже существует!')

        editBlocksSet(player, name, blockSets)
      })
  })
  for (const key of Object.keys(blockSets)) {
    sets.addButton(key, () => editBlocksSet(player, key, blockSets))
  }
  sets.show(player)
}

/**
 * @param {Player} player
 * @param {string} setName
 * @param {BlocksSets} sets
 * @param {"inventory" | "see" | "edit"} mode
 */
function editBlocksSet(player, setName, sets, mode = 'see') {
  if (!(setName in sets)) mode = 'inventory'

  const form = new ChestFormData('large')
  form.pattern(
    [0, 0],
    [
      'xxxxOxxxx',
      '---------',
      '---------',
      '---------',
      '---------',
      'xxxxxxxxx',
    ],
    {
      x: { iconPath: 'textures/blocks/glass', data: { itemName: 'Назад' } },
      O: { iconPath: 'textures/items/arrow', data: {} },
    }
  )

  if (mode === 'inventory') {
    const { container } = player.getComponent('inventory')

    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i)
      if (item) {
        form.button(
          9 + i,
          item.typeId.replace('minecraft:', ''),
          [],
          item.typeId
        )
      }
    }
  } else if (mode === 'see') {
    const set = sets[setName]
    for (const [i, item] of set.entries()) {
      if (item) {
        form.button(9 + i, item[0].replace('minecraft:', ''), [], item[0])
      }
    }
  }

  showForm(form, player).then(e => {
    console.debug(e)
    if (e && !e.canceled && e instanceof ActionFormResponse) {
      if (e.selection === 4) {
        WBBlocksSets(player)
      }
    }
  })
}

import { BlockTypes, Player } from '@minecraft/server'
import { ChestForm } from 'lib/Form/ChestForm.js'
import { prompt } from 'modules/Gameplay/Build/utils.js'
import {
  getAllBlockSets,
  setBlockSet,
} from 'modules/WorldEdit/utils/blocksSet.js'
import {
  ActionForm,
  BUTTON,
  FormCallback,
  GAME_UTILS,
  ModalForm,
  util,
} from 'smapi.js'
import { WorldEditTool } from './class/Tool.js'

/**
 * @param {Player} player
 */
export function WEMenu(player, body = '') {
  const heldItem = player.mainhand()
  if (heldItem.typeId) {
    body = `Создание доступно только при пустой руке.` || body
  }

  const form = new ActionForm('§dWorld§6Edit', body).addButton(
    'Наборы блоков',
    () => WEBlocksSets(player)
  )

  for (const tool of WorldEditTool.tools) {
    const buttonName = tool.getMenuButtonName(player)
    if (!buttonName) continue
    form.addButton(buttonName, () => {
      const slotOrError = tool.getToolSlot(player)
      if (typeof slotOrError === 'string') {
        WEMenu(player, '§c' + slotOrError)
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
function WEBlocksSets(player) {
  const blockSets = getAllBlockSets(player)
  const sets = new ActionForm('Наборы блоков')
  sets.addButton('Назад', () => WEMenu(player))
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
 * @param {import('modules/WorldEdit/utils/blocksSet.js').BlocksSets} sets
 * @param {boolean} canEdit
 */
function editBlocksSet(player, setName, sets, canEdit = true, add = true) {
  const set = sets[setName] ?? []
  if (!set) canEdit = true

  const blockBelow = player.dimension.getBlock(player.location)?.below()
  const form = new ChestForm('large')
  /** @type {import('lib/Form/ChestForm.js').ChestButtonOptions} */
  const empty = {
    slot: 0,
    icon: 'textures/blocks/glass',
    nameTag: 'Пусто',
    callback: () =>
      editBlocksSet(
        // @ts-expect-error We can pass them
        ...arguments
      ),
  }

  form.title(setName)
  form.pattern(
    [0, 0],
    [
      'x<x+xDx?x', // row 0
      '---------', // row 1
      '---------', // row 2
      canEdit ? 'xxx>Bxxxx' : '---------', // row 3
      '---------', // row 4
      '---------', // row 5
    ],
    {
      '<': {
        icon: BUTTON['<'],
        nameTag: 'Назад',
        callback() {
          WEBlocksSets(player)
        },
      },
      'x': empty,
      '+': {
        icon: add ? BUTTON['+'] : BUTTON['-'],
        nameTag: add ? 'Режим добавления' : 'Режим удаления',
        description: 'Нажмите чтобы переключить',
        callback() {
          editBlocksSet(player, setName, sets, canEdit, !add)
        },
      },
      'D': {
        icon: 'textures/ui/trash_light',
        description: '§cОчистить набор ото всех выключенных блоков',
        callback() {
          const blocksToClear = set.filter(e => (e[2] ?? 1) < 1)

          prompt(
            player,
            'Выключенные блоки будут очищены. Список:\n' +
              blocksToClear.map(e => GAME_UTILS.toNameTag(e[0])).join('\n'),
            '§cОчистить',
            () => {
              setBlockSet(
                player,
                setName,
                set.filter(e => !blocksToClear.includes(e))
              )
              editBlocksSet(
                player,
                setName,
                getAllBlockSets(player),
                canEdit,
                add
              )
            },
            'Отмена',
            () =>
              editBlocksSet(
                // @ts-expect-error We can pass them
                ...arguments
              )
          )
        },
      },
      '?': blockBelow
        ? {
            icon: BUTTON['?'],
            nameTag: 'Редактирование набора',
            description:
              'Чтобы убрать блок или уменьшить кол-во нажмите на блок сверху, чтобы добавить в набор - на блок из инвентаря, снизу.',
          }
        : empty,

      '>': {
        icon: BUTTON['>'],
        nameTag: 'Блок под ногами',
        description:
          'Если нужно добавить в набор блок с опред. типом камня, например, то поставьте его под ноги и нажмите здесь.',
      },
      'B': blockBelow
        ? addBlock(
            0,
            blockBelow.typeId,
            blockBelow.permutation.getAllStates(),
            false
          ) ?? empty
        : empty,
    }
  )

  /**
   *
   * @param {number} slot
   * @param {string} typeId
   * @param {Record<string, string | number | boolean> | undefined} states
   */
  function addBlock(slot, typeId, states, setButton = true) {
    // Prevent from using {} state
    if (states && Object.keys(states).length < 1) states = undefined

    // If block is already in blocksSet
    const blockInSet = set.find(
      ([t, s]) => t === typeId && JSON.stringify(s) === JSON.stringify(states)
    )

    // Amount of block in blocksSet
    const amount = blockInSet?.[2] ?? 0

    /** @type {import('lib/Form/ChestForm.js').ChestButtonOptions} */
    const button = {
      slot: slot,
      icon: typeId,
      enchanted: amount > 0,
      amount: Math.max(amount, 1),
      nameTag: GAME_UTILS.toNameTag(typeId),
      lore: [
        '',
        ...(states ? util.inspect(states).split('\n') : []),
        '',
        amount > 0
          ? '§aВключен§f в наборе.'
          : blockInSet
          ? '§cВыключен§f в наборе, но остается тут.'
          : '§7Не добавлен в набор.',
        add
          ? '§a[+] §rНажмите для добавления блока'
          : // If no block in set or already disabled show nothing
          blockInSet && amount > 0
          ? '§c[-] §rНажмите для уменьшения кол-ва блока'
          : '',
      ],
      callback() {
        if (blockInSet) {
          blockInSet[2] = add ? amount + 1 : amount - 1
        } else if (add) {
          if (set.length >= 18) {
            new FormCallback(form, player).error(
              'Максимальный размер набора блоков - 18. Выключите ненужные блоки и очистите набор от них прежде чем добавить новые.'
            )
          }
          set.push([typeId, states, 1])
        }

        for (const block of set) {
          // Do not decrease below 0
          if (typeof block[2] === 'number' && block[2] < 0) block[2] = 0
        }

        editBlocksSet(player, setName, getAllBlockSets(player), canEdit, add)
      },
    }
    if (setButton) form.button(button)
    else return button
  }

  for (const [i, item] of set.entries()) {
    if (item) {
      const [typeId, states] = item
      const base = 9 * 1 // 1 row
      addBlock(base + i, typeId, states)
    }
  }

  if (canEdit) {
    const { container } = player.getComponent('inventory')
    /** @type {string[]} */
    const blocks = []
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i)
      if (
        !item ||
        set.find(e => e[0] === item.typeId) ||
        !BlockTypes.get(item.typeId) ||
        blocks.includes(item.typeId)
      )
        continue

      const base = 9 * 4 // 4 row
      addBlock(base + blocks.length, item.typeId, undefined)
      blocks.push(item.typeId)
    }
  }

  form.show(player)
}

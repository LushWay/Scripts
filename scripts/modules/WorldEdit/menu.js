import { BlockPermutation, BlockStates, BlockTypes, Player } from '@minecraft/server'
import { ChestForm } from 'lib/Form/ChestForm.js'
import { prompt } from 'lib/Form/MessageForm.js'
import {
  DEFAULT_BLOCK_SETS,
  SHARED_POSTFIX,
  getAllBlockSets,
  getOtherPlayersBlockSets,
  setBlockSet,
} from 'modules/WorldEdit/utils/blocksSet.js'
import { ActionForm, BUTTON, FormCallback, GAME_UTILS, ModalForm, util } from 'smapi.js'
import { WorldEditTool } from './class/Tool.js'

/**
 * @param {Player} player
 */
export function WEMenu(player, body = '') {
  const heldItem = player.mainhand()
  if (heldItem.typeId) {
    body = `Создание доступно только при пустой руке.` || body
  }

  const form = new ActionForm('§dWorld§6Edit', body).addButton('Наборы блоков', () => WEBlocksSets(player))

  for (const tool of WorldEditTool.tools) {
    const buttonName = tool.getMenuButtonName(player)
    if (!buttonName) continue
    form.addButton(buttonName, () => {
      const slotOrError = tool.getToolSlot(player)
      if (typeof slotOrError === 'string') {
        WEMenu(player, '§c' + slotOrError)
      } else {
        tool.editToolForm?.(slotOrError, player, false)
      }
    })
  }

  form.show(player)
}
/**
 * @param {Player} player
 */
function WEBlocksSets(player) {
  const blockSets = getAllBlockSets(player.id)
  const sets = new ActionForm('Наборы блоков')
  sets.addButton(ActionForm.backText, () => WEMenu(player))
  sets.addButton('§3Новый набор блоков', 'textures/ui/plus', () => {
    manageBlockSet({
      blockSets,
      player,
      action: 'Создать новый',
      onFail: () => {},
    })
  })

  sets.addButton('§3Наборы других игроков...', () => otherPlayersBlockSets(player, () => WEBlocksSets(player)))

  for (const setName of Object.keys(blockSets)) {
    const shared = Object.values(DEFAULT_BLOCK_SETS).find(e => blockSets[setName] === e)
    sets.addButton(setName, () =>
      editBlocksSet({
        player,
        setName,
        sets: blockSets,
        ownsSet: !shared,
      })
    )
  }
  sets.show(player)
}

/**
 * @param {object} o
 * @param {import('modules/WorldEdit/utils/blocksSet.js').BlocksSets} o.blockSets
 * @param {Player} o.player
 * @param {string} o.action
 * @param {string} [o.setName]
 * @param {import('modules/WorldEdit/utils/blocksSet.js').BlocksSets[string]} [o.set]
 * @param {boolean} [o.deletePrevious=false]
 * @param {() => void} [o.onFail]
 */
function manageBlockSet({
  blockSets,
  player,
  action,
  setName,
  set = setName ? blockSets[setName] : undefined,
  deletePrevious = false,
  onFail = () => {},
}) {
  new ModalForm(action)
    .addTextField(
      `Существующие наборы:\n${Object.keys(blockSets).join('\n')}\n\nИмя набора:`,
      'Действие будет отменено.',
      setName
    )
    .show(player, (ctx, name) => {
      if (name in blockSets) return ctx.error('Набор с именем ' + name + ' уже существует!')

      if (!name || name === setName) return onFail()
      if (deletePrevious && setName) setBlockSet(player.id, setName, undefined)
      setBlockSet(player.id, name, set ? JSON.parse(JSON.stringify(set)) : set)
      editBlocksSet({
        player,
        setName: name,
        sets: undefined,
        ownsSet: true,
      })
    })
}

/**
 * @param {Player} player
 * @param {() => void} onBack
 */
function otherPlayersBlockSets(player, onBack) {
  const form = new ActionForm('§3Наборы блоков других игроков')
  form.addButton(ActionForm.backText, onBack)

  for (const [otherPlayerId, blockSets] of getOtherPlayersBlockSets(player.id)) {
    const name = Player.name(otherPlayerId) ?? otherPlayerId

    form.addButton(name, () => {
      playerBlockSet(player, otherPlayerId, blockSets, () => otherPlayersBlockSets(player, onBack))
    })
  }
  form.show(player)
}

/**
 *
 * @param {Player} player
 * @param {string} otherPlayerId
 * @param {import('modules/WorldEdit/utils/blocksSet.js').BlocksSets} blockSets
 * @param {() => void} onBack
 */
function playerBlockSet(player, otherPlayerId, blockSets, onBack) {
  const name = Player.name(otherPlayerId) ?? otherPlayerId

  const pform = new ActionForm(name ?? otherPlayerId, '§3Наборы блоков:')
  pform.addButton(ActionForm.backText, onBack)

  for (const setName of Object.keys(blockSets)) {
    pform.addButton(setName, () =>
      editBlocksSet({
        player,
        setName,
        sets: blockSets,
        ownsSet: false,
        back: () => pform.show(player),
      })
    )
  }
  pform.show(player)
}

/**
 * @param {object} o
 * @param {Player} o.player
 * @param {string} o.setName
 * @param {import('modules/WorldEdit/utils/blocksSet.js').BlocksSets} [o.sets]
 * @param {boolean} [o.ownsSet]
 * @param {boolean} [o.add]
 * @param {boolean} [o.editStates]
 * @param {() => void} [o.back]
 */
function editBlocksSet(o) {
  const {
    player,
    setName,
    sets = getAllBlockSets(player.id),
    ownsSet = true,
    add = true,
    editStates = false,
    back = () => WEBlocksSets(player),
  } = o
  let set = sets[setName]
  if (!set) {
    set = []
    setBlockSet(player.id, setName, set)
    sets[setName] = set
  }

  const blockBelow = player.dimension.getBlock(player.location)?.below()
  const blockOnViewHit = player.getBlockFromViewDirection()
  const blockOnView = blockOnViewHit && blockOnViewHit.block
  const form = new ChestForm('large')

  /** @type {import('lib/Form/ChestForm.js').ChestButtonOptions} */
  const empty = {
    slot: 0,
    icon: 'textures/blocks/glass',
    nameTag: 'Пусто',
    callback: () => editBlocksSet(o),
  }

  form.title(setName)
  form.pattern(
    [0, 0],
    [
      ownsSet ? 'x<x+xSxD?' : 'x<xxxxxx?', // row 0
      '---------', // row 1
      '---------', // row 2
      ownsSet ? 'xxY>BxNCR' : 'xxxxAxxxx', // row 3
      '---------', // row 4
      '---------', // row 5
    ],
    {
      'A': {
        icon: 'textures/ui/copy',
        nameTag: 'Копировать набор',
        description: 'Нажмите чтобы скопировать набор в свой список наборов. Вы сможете редактировать его.',
        callback() {
          const newName = setName.replace(SHARED_POSTFIX, '')
          setBlockSet(player.id, newName, set)
          editBlocksSet({
            ...o,
            setName: newName,
            sets: undefined,
            ownsSet: true,
          })
        },
      },
      'C': {
        icon: 'textures/ui/copy',
        nameTag: 'Копировать набор',
        description: 'Нажмите чтобы копировать набор.',
        callback() {
          manageBlockSet({
            player,
            setName,
            set,
            blockSets: sets,
            action: 'Копировать набор',
            deletePrevious: false,
            onFail: () => editBlocksSet(o),
          })
        },
      },
      'N': {
        icon: 'textures/ui/editIcon',
        nameTag: 'Переименовать набор',
        description: 'Нажмите чтобы переименовать набор.',
        callback() {
          manageBlockSet({
            player,
            setName,
            set,
            blockSets: sets,
            action: 'Переименовать набор',
            deletePrevious: true,
            onFail: () => editBlocksSet(o),
          })
        },
      },
      '<': {
        icon: BUTTON['<'],
        nameTag: ActionForm.backText,
        callback: back,
      },
      'x': empty,
      '+': editStates
        ? empty
        : {
            icon: add ? BUTTON['+'] : BUTTON['-'],
            nameTag: add ? 'Режим добавления' : 'Режим удаления',
            description: 'Нажмите чтобы переключить',
            callback() {
              editBlocksSet({ ...o, add: !add, editStates: false })
            },
          },
      'S': {
        icon: editStates ? 'textures/ui/book_metatag_pressed' : 'textures/ui/book_metatag_default',
        nameTag: editStates ? 'Вернутьс в режим добавления блоков' : 'Вернуться в режим редактирования типов блоков',
        description: 'Нажмите чтобы переключить',
        callback() {
          editBlocksSet({ ...o, editStates: !editStates })
        },
      },
      'D': {
        icon: 'textures/ui/trash_light',
        nameTag: '§cОчистить',
        description: '\n§cочищает набор ото всех выключенных блоков',
        callback() {
          const blocksToClear = set.filter(e => (e[2] ?? 1) < 1)

          prompt(
            player,
            'Выключенные блоки будут очищены. Список:\n' +
              blocksToClear.map(e => GAME_UTILS.toNameTag(e[0])).join('\n'),
            '§cОчистить',
            () => {
              setBlockSet(
                player.id,
                setName,
                set.filter(e => !blocksToClear.includes(e))
              )
              editBlocksSet({ ...o, sets: undefined })
            },
            'Отмена',
            () => editBlocksSet(o)
          )
        },
      },
      'R': {
        icon: 'textures/ui/book_trash_default',
        nameTag: '§4Удалить',
        description: '\n§4безвозвратно удаляет набор',
        callback() {
          prompt(
            player,
            '§cУдалить набор? Это действие нельзя отменить',
            '§cУдалить',
            () => {
              setBlockSet(player.id, setName, undefined)
              back()
            },
            'Отмена',
            () => editBlocksSet(o)
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
        icon: BUTTON['?'],
        nameTag: 'Блоки рядом',
        description:
          'Блок под ногами и блок на который вы смотрите. Если нужно добавить в набор блок с опред. типом камня, например, то поставьте его под ноги и нажмите здесь.',
      },
      'B': blockBelow ? addBlock(0, blockBelow.typeId, blockBelow.permutation.getAllStates(), false) ?? empty : empty,
      'Y': blockOnView
        ? addBlock(0, blockOnView.typeId, blockOnView.permutation.getAllStates(), false) ?? empty
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
    const blockInSet = set.find(([t, s]) => t === typeId && JSON.stringify(s) === JSON.stringify(states))

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
        ownsSet
          ? editStates
            ? 'Нажмите, чтобы редактировать значения выше'
            : add
            ? '§a[+] §rНажмите для добавления блока'
            : blockInSet && amount > 0
            ? '§c[-] §rНажмите для уменьшения кол-ва блока'
            : // If no block in set or already disabled show nothing
              ''
          : '',
      ],
      async callback() {
        if (!ownsSet) return editBlocksSet(o)

        if (!editStates) {
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
        } else {
          if (!blockInSet)
            return new FormCallback(form, player).error(
              'Невозможно редактировать свойства блока, не находящегося в наборе. Добавьте его в набор.'
            )

          blockInSet[1] = await editBlockStates(player, blockInSet[1] ?? {}, () => editBlocksSet(o))
        }

        // Save changes
        setBlockSet(player.id, setName, set)

        // Reopen to show them
        editBlocksSet({ ...o, sets: getAllBlockSets(player.id) })
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

  if (ownsSet) {
    const { container } = player
    if (!container) return
    /** @type {string[]} */
    const blocks = []
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i)
      if (!item || set.find(e => e[0] === item.typeId) || !BlockTypes.get(item.typeId) || blocks.includes(item.typeId))
        continue

      const base = 9 * 4 // 4 row
      addBlock(base + blocks.length, item.typeId, undefined)
      blocks.push(item.typeId)
    }
  }

  form.show(player)
}

const allStates = BlockStates.getAll()

/**
 * @param {Player} player
 * @param {Record<string, string | boolean | number>} states
 * @param {() => void} back
 * @returns {Promise<Record<string, string | boolean | number>>}
 */
export function editBlockStates(player, states, back, edited = false) {
  const promise = new Promise(resolve => {
    const form = new ActionForm('Редактировать свойства блока')
    form.addButton(ActionForm.backText, () => {
      resolve(states)
    })
    if (edited) form.addButton(ActionForm.backText + ' без сохранения', back)
    form.addButton('§cУдалить все свойства блока', () =>
      prompt(
        player,
        'Точно удалить все свойства блока?',
        'Да',
        () => resolve({}),
        'Отмена',
        () => form.show(player)
      )
    )

    for (let [stateName, stateValue] of Object.entries(states)) {
      const stateDef = allStates.find(e => e.id === stateName)
      if (!stateDef) continue

      form.addButton(
        `${stateName}: ${util.stringify(stateValue)}\n${
          stateDef.validValues[0] === stateValue ? '§8По умолчанию' : ''
        }`,
        () => {
          update()

          function update() {
            const editStateForm = new ActionForm(stateName, `Значение сейчас: ${util.stringify(stateValue)}`)

            editStateForm.addButtonBack(() => {
              resolve(editBlockStates(player, states, back))
            })
            editStateForm.addButton('§cУдалить значение', () => {
              delete states[stateName]
              resolve(editBlockStates(player, states, back))
            })

            try {
              if (!stateDef) return
              for (const validValue of Array.from(stateDef.validValues)) {
                editStateForm.addButton(`${validValue === stateValue ? '> ' : ''}${util.stringify(validValue)}`, () => {
                  states[stateName] = validValue
                  stateValue = validValue
                  update()
                })
              }
            } catch (e) {
              util.error(e)
            }

            editStateForm.show(player)
          }
        }
      )
    }

    form.show(player)
  })

  promise.catch(util.catch)

  return promise
}
/**
 * @typedef {{typeId: string; states: Record<string, string | number | boolean>;}} ReplaceTarget
 */
/**
 * @param {ReplaceTarget | BlockPermutation} target
 */
export function toPermutation(target) {
  return target instanceof BlockPermutation ? target : BlockPermutation.resolve(target.typeId, target.states)
}

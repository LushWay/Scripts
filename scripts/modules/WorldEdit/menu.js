import { BlockPermutation, BlockStates, BlockTypes, ItemStack, Player, Vector } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config.js'
import { ActionForm, BUTTON, FormCallback, ModalForm, is, typeIdToReadable, util } from 'lib.js'
import { ChestForm } from 'lib/Form/ChestForm.js'
import { prompt } from 'lib/Form/MessageForm.js'
import { WorldEdit } from 'modules/WorldEdit/class/WorldEdit.js'
import { createNylium } from 'modules/WorldEdit/tools/nylium.js'
import {
  DEFAULT_BLOCK_SETS,
  SHARED_POSTFIX,
  blockSetDropdown,
  getAllBlockSets,
  getBlockSetForReplaceTarget,
  getOtherPlayersBlockSets,
  setBlockSet,
} from 'modules/WorldEdit/utils/blocksSet.js'
import { WorldEditTool } from './class/WorldEditTool.js'

/**
 * Main we menu
 * @param {Player} player
 */
export function WEmenu(player, body = '') {
  const heldItem = player.mainhand()
  if (heldItem.typeId) {
    body = `Создание доступно только при пустой руке.` || body
  }

  const form = new ActionForm('§dWorld§6Edit', body)
  form.addButton('§3Наборы блоков', () => WEblocksSetsMenu(player))
  form.addButton('§3Отмена/Восстановление', () => WEundoRedoMenu(player))

  for (const tool of WorldEditTool.tools) {
    const buttonName = tool.getMenuButtonName(player)
    if (!buttonName) continue

    form.addButton(buttonName, () => {
      const slotOrError = tool.getToolSlot(player)
      if (typeof slotOrError === 'string') {
        WEmenu(player, '§c' + slotOrError)
      } else {
        tool.editToolForm?.(slotOrError, player, false)
      }
    })
  }

  form.addButton('Создать раздатчик блоков из набора', () => {
    new ModalForm('Выбери набор блоков...')
      .addDropdown('Набор блоков', ...blockSetDropdown(['', ''], player))
      .show(player, (ctx, blockset) => {
        /** @type {ReplaceTarget[]} */
        // @ts-expect-error Filter misstype
        const blocks = getBlockSetForReplaceTarget([player.id, blockset]).filter(e => e !== undefined)
        const pos1 = Vector.floor(player.location)
        const pos2 = Vector.add(pos1, { x: 0, z: 0, y: -blocks.length })
        WorldEdit.forPlayer(player).backup('Раздатчик блоков из набора', pos1, pos2)

        const block = player.dimension.getBlock(player.location)
        const nylium = new ItemStack(MinecraftBlockTypes.WarpedNylium)
        createNylium(nylium, player, blockset)
        nylium.amount = 64
        block?.setType(MinecraftBlockTypes.Chest)
        const container = block?.getComponent('inventory')?.container

        for (const [i, slot] of container?.slotEntries() ?? []) {
          container?.setItem(i, nylium.clone())
        }

        for (const [i, block] of blocks.entries()) {
          player.dimension.getBlock(Vector.add(pos1, { x: 0, z: 0, y: -i - 1 }))?.setPermutation(toPermutation(block))
        }
      })
  })

  form.show(player)
}

/**
 * @param {Player} player
 */
function WEblocksSetsMenu(player) {
  const blockSets = getAllBlockSets(player.id)
  const sets = new ActionForm('Наборы блоков')
  sets.addButton(ActionForm.backText, () => WEmenu(player))
  sets.addButton('§3Новый набор блоков', 'textures/ui/plus', () => {
    WEmanageBlocksSetMenu({
      blockSets,
      player,
      action: 'Создать новый',
      onFail: () => {},
    })
  })

  sets.addButton('§3Наборы других игроков...', () =>
    WEotherPlayersBlockSetsMenu(player, () => WEblocksSetsMenu(player))
  )

  for (const setName of Object.keys(blockSets)) {
    const shared = Object.values(DEFAULT_BLOCK_SETS).find(e => blockSets[setName] === e)
    sets.addButton(setName, () =>
      WEeditBlocksSetMenu({
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
function WEmanageBlocksSetMenu({
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
      WEeditBlocksSetMenu({
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
function WEotherPlayersBlockSetsMenu(player, onBack) {
  const form = new ActionForm('§3Наборы блоков других игроков')
  form.addButton(ActionForm.backText, onBack)

  for (const [otherPlayerId, blockSets] of getOtherPlayersBlockSets(player.id)) {
    const name = Player.name(otherPlayerId) ?? otherPlayerId

    form.addButton(name, () => {
      WEplayerBlockSetMenu(player, otherPlayerId, blockSets, () => WEotherPlayersBlockSetsMenu(player, onBack))
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
function WEplayerBlockSetMenu(player, otherPlayerId, blockSets, onBack) {
  const name = Player.name(otherPlayerId) ?? otherPlayerId

  const pform = new ActionForm(name ?? otherPlayerId, '§3Наборы блоков:')
  pform.addButton(ActionForm.backText, onBack)

  for (const setName of Object.keys(blockSets)) {
    pform.addButton(setName, () =>
      WEeditBlocksSetMenu({
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
function WEeditBlocksSetMenu(o) {
  const {
    player,
    setName,
    sets = getAllBlockSets(player.id),
    ownsSet = true,
    add = true,
    editStates = false,
    back = () => WEblocksSetsMenu(player),
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
    callback: () => WEeditBlocksSetMenu(o),
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
          WEeditBlocksSetMenu({
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
          WEmanageBlocksSetMenu({
            player,
            setName,
            set,
            blockSets: sets,
            action: 'Копировать набор',
            deletePrevious: false,
            onFail: () => WEeditBlocksSetMenu(o),
          })
        },
      },
      'N': {
        icon: 'textures/ui/editIcon',
        nameTag: 'Переименовать набор',
        description: 'Нажмите чтобы переименовать набор.',
        callback() {
          WEmanageBlocksSetMenu({
            player,
            setName,
            set,
            blockSets: sets,
            action: 'Переименовать набор',
            deletePrevious: true,
            onFail: () => WEeditBlocksSetMenu(o),
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
              WEeditBlocksSetMenu({ ...o, add: !add, editStates: false })
            },
          },
      'S': {
        icon: editStates ? 'textures/ui/book_metatag_pressed' : 'textures/ui/book_metatag_default',
        nameTag: editStates ? 'Вернутьс в режим добавления блоков' : 'Вернуться в режим редактирования типов блоков',
        description: 'Нажмите чтобы переключить',
        callback() {
          WEeditBlocksSetMenu({ ...o, editStates: !editStates })
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
            'Выключенные блоки будут очищены. Список:\n' + blocksToClear.map(e => typeIdToReadable(e[0])).join('\n'),
            '§cОчистить',
            () => {
              setBlockSet(
                player.id,
                setName,
                set.filter(e => !blocksToClear.includes(e))
              )
              WEeditBlocksSetMenu({ ...o, sets: undefined })
            },
            'Отмена',
            () => WEeditBlocksSetMenu(o)
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
            () => WEeditBlocksSetMenu(o)
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
      nameTag: typeIdToReadable(typeId),
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
        if (!ownsSet) return WEeditBlocksSetMenu(o)

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

          blockInSet[1] = await WEeditBlockStatesMenu(player, blockInSet[1] ?? {}, () => WEeditBlocksSetMenu(o))
        }

        // Save changes
        setBlockSet(player.id, setName, set)

        // Reopen to show them
        WEeditBlocksSetMenu({ ...o, sets: getAllBlockSets(player.id) })
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
export function WEeditBlockStatesMenu(player, states, back, edited = false) {
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

    // eslint-disable-next-line prefer-const
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
              resolve(WEeditBlockStatesMenu(player, states, back))
            })
            editStateForm.addButton('§cУдалить значение', () => {
              delete states[stateName]
              resolve(WEeditBlockStatesMenu(player, states, back))
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
 * Reference to block that can be replaced
 * @typedef {{
 *   typeId: string;
 *   states: Record<string, string | number | boolean>;
 * }} ReplaceTarget
 */

/**
 * Converts replace target or block permutation to permutation. Usefull when need to make code cleaner
 * @param {ReplaceTarget | BlockPermutation} target
 */
export function toPermutation(target) {
  return target instanceof BlockPermutation ? target : BlockPermutation.resolve(target.typeId, target.states)
}

/**
 * Converts replace target or block permutation to replace target. Usefull when need to make code cleaner
 * @param {ReplaceTarget | BlockPermutation | undefined} permutation
 */
export function toReplaceTarget(permutation) {
  return permutation && permutation instanceof BlockPermutation
    ? { typeId: permutation.type.id, states: permutation.getAllStates() }
    : permutation
}

/**
 * Stringifies replace targets to like "Wooden Slab, Stone"
 * @param {(undefined | ReplaceTarget)[]} targets
 */
export function stringifyReplaceTargets(targets) {
  return targets
    .map(e => e?.typeId && typeIdToReadable(e.typeId))
    .filter(Boolean)
    .join(', ')
}

/**
 * Show undo/redo (manage history) menu to player
 * @param {Player} player - Player to show to
 * @param {VoidFunction} [back] - Function that gets called when player press back
 * @param {'undo' | 'redo'} [mode] - Either to show undoed or redoed action
 * @param {string} [source] - Player whos history will be shown
 */
export function WEundoRedoMenu(player, back = () => WEmenu(player), mode = 'undo', source = player.id, body = '') {
  const form = new ActionForm(
    'Отмена/Восстановление',
    body +
      `§3Нажмите на одно из последних действий ниже чтобы ${mode === 'undo' ? 'отменить (undo)' : 'вернуть (redo)'}${
        player.id !== source ? `\n§3Показаны действия игрока §f§l${Player.name(source) ?? '<Без имени>'}` : ''
      }`
  )
  form.addButtonBack(back)
  form.addButton(mode === 'undo' ? '§3Вернуть отмененное (redo)' : '§3Отмены (undo)', () =>
    WEundoRedoMenu(player, back, mode === 'undo' ? 'redo' : 'undo', source)
  )

  if (is(player.id, 'grandBuilder')) {
    form.addButton('§3Действия других игроков', () => {
      WEundoRedoOtherPlayersMenu(player, () => form.show(player))
    })
  }

  const we = WorldEdit.instances[source]
  const actions = mode === 'undo' ? we.history : we.undos
  // TODO Maybe group similiar actions
  for (const action of actions.slice().reverse()) {
    form.addButton(action.name, () => {
      we.loadBackup(actions, action)
      player.playSound(SOUNDS.success)
      WEundoRedoMenu(player, back, mode, source, '§aУспешно загружено!\n\n')
    })
  }

  form.show(player)
}

/**
 *
 * @param {Player} player
 * @param {VoidFunction} back
 */
function WEundoRedoOtherPlayersMenu(player, back) {
  const form = new ActionForm('Выбрать игрока...').addButtonBack(back)

  for (const playerId of Object.keys(WorldEdit.instances)) {
    const name = Player.name(playerId) ?? '<Без имени>'
    form.addButton(name, () => {
      WEundoRedoMenu(player, () => WEundoRedoOtherPlayersMenu(player, back), 'undo', playerId)
    })
  }

  form.show(player)
}

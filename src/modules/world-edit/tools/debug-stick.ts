import { Block, BlockStates, ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { BlockStateSuperset } from '@minecraft/vanilla-data'
import { ModalForm, Vector } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t, textTable } from 'lib/text'
import { WorldEditTool } from '../lib/world-edit-tool'
import { WEeditBlockStatesMenu } from '../menu'

interface StorageSchema extends JsonObject {
  version: number
  mode: 'ui' | 'click'
}

class DebugStick extends WorldEditTool<StorageSchema> {
  id = 'debugstick'
  typeId = Items.WeDebugstick
  name = 'Палка отладки'
  storageSchema: StorageSchema = {
    version: 1,
    mode: 'ui',
  }

  editToolForm(slot: ContainerSlot, player: Player, initial?: boolean): void {
    const storage = this.getStorage(slot)
    new ModalForm(this.name)
      .addTextField('Ыыы просто потому что интерфейс сломан лол', '')
      .addDropdownFromObject(
        'Тип активации',
        {
          ui: 'Интерфейс',
          click: 'При использовании',
        },
        {
          defaultValue: storage.mode,
        },
      )
      .show(player, (_, __, mode) => {
        storage.mode = mode
        this.saveStorage(slot, storage)
        player.info(t`Mode is set to ${mode}`)
      })
  }

  onUseOnBlock(player: Player, _: ItemStack, block: Block, storage: StorageSchema): void {
    if (storage.mode === 'ui') {
      this.openForm(player, block)
    } else {
      this.changeProperty(player, block)
    }
  }

  private openForm(player: Player, block: Block) {
    const blockStates = block.permutation.getAllStates()
    const onChangeListener = (states: Record<string, string | number | boolean> = blockStates): void => {
      let permutation = block.permutation
      for (const [state, value] of Object.entries(states)) {
        permutation = permutation.withState(state as keyof BlockStateSuperset, value)
      }
      block.setPermutation(permutation)
    }
    WEeditBlockStatesMenu(player, blockStates, onChangeListener, false, '§l§bСохранить').then(onChangeListener)
  }

  constructor() {
    super()
    this.onInterval(10, player => {
      const hit = player.getBlockFromViewDirection({
        includePassableBlocks: true,
        includeLiquidBlocks: true,
        maxDistance: 20,
      })
      if (!hit) return

      const stateInfo = this.getStatesInfo(hit.block)
      if (!stateInfo) return this.noStatesToChangeWarning(player, hit.block)

      const { stateName, stateNames, allStates } = stateInfo
      player.onScreenDisplay.setActionBar(
        this.statesToString(player, stateNames, hit.block, allStates, stateName),
        ActionbarPriority.PvP,
      )
    })
  }

  private blockCache = new Map<string, string>()

  private statesToString(
    player: Player,
    stateNames: string[],
    block: Block,
    allStates: Record<string, string | number | boolean>,
    stateName: string,
  ) {
    const nextStateName = player.isSneaking ? nextValue(stateNames, stateName) : stateName
    return t`${Vector.string(block, true)} ${block.typeId}\n${textTable(
      Object.map(allStates, (key, value) =>
        key === stateName ? ['§b' + key, value] : key === nextStateName ? ['§e' + key, value] : [key, value],
      ),
      true,
    )}`
  }

  private changeProperty(player: Player, block: Block) {
    const stateInfo = this.getStatesInfo(block)
    if (!stateInfo) return this.noStatesToChangeWarning(player, block)

    const { stateNames, stateName, allStates, cacheId } = stateInfo

    if (player.isSneaking) {
      if (stateNames.length === 1)
        return player.onScreenDisplay.setActionBar(
          t.error`У блока ${block.typeId} всего одно состояние`,
          ActionbarPriority.UrgentNotificiation,
        )

      const nextStateName = nextValue(stateNames, stateName)
      this.blockCache.set(cacheId, nextStateName)
    } else {
      const validValues = BlockStates.get(stateName)?.validValues ?? [allStates[stateName]]
      const stateValue = allStates[stateName]
      const nextStateValue = nextValue(validValues, stateValue)
      const permutation = block.permutation.withState(stateName as keyof BlockStateSuperset, nextStateValue)
      block.setPermutation(permutation)
    }
    player.onScreenDisplay.setActionBar(
      this.statesToString(player, stateNames, block, allStates, stateName),
      ActionbarPriority.PvP,
    )
  }

  private noStatesToChangeWarning(player: Player, block: Block) {
    return player.onScreenDisplay.setActionBar(
      t.error`У блока ${block.typeId} нет состояний для изменения`,
      ActionbarPriority.PvP,
    )
  }

  private getStatesInfo(block: Block) {
    const allStates = block.permutation.getAllStates()
    const stateNames = Object.keys(allStates)
    if (stateNames.length === 0) return

    const cacheId = block.typeId
    const stateName = this.blockCache.get(cacheId) ?? stateNames[0]
    return { stateNames, stateName, allStates, cacheId }
  }
}

function nextValue<T>(array: T[], value: T) {
  return array[array.findIndex(e => e === value) + 1] ?? array[0]
}

new DebugStick()

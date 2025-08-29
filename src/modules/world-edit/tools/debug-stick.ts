import { Block, BlockStates, ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { BlockStateSuperset } from '@minecraft/vanilla-data'
import { ModalForm, Vec } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n, noI18n } from 'lib/i18n/text'
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
      .addDropdownFromObject('Activation type', { ui: 'UI', click: 'On use' }, { defaultValue: storage.mode })
      .show(player, (_, mode) => {
        storage.mode = mode
        this.saveStorage(slot, storage)
        player.info(i18n`Mode is set to ${mode}`)
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
    WEeditBlockStatesMenu(player, blockStates, onChangeListener, false, '§l§bSave').then(onChangeListener)
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

  private blockLocationCache = new Map<string, string>()
  private blockTypeCache = new Map<string, string>()

  private statesToString(
    player: Player,
    stateNames: string[],
    block: Block,
    allStates: Record<string, string | number | boolean>,
    stateName: string,
  ) {
    const nextStateName = player.isSneaking ? nextValue(stateNames, stateName) : stateName
    return noI18n`${Vec.string(block, true)} ${block.typeId}\n${Object.entries(allStates)
      .map(([key, value]) => `${(key === stateName ? '§b' : key === nextStateName ? '§9' : '§7') + key}: ${value}`)
      .join('\n')}`
  }

  private changeProperty(player: Player, block: Block) {
    const stateInfo = this.getStatesInfo(block)
    if (!stateInfo) return this.noStatesToChangeWarning(player, block)

    const { stateNames, stateName, allStates, cacheLocationId, cacheTypeId } = stateInfo

    if (player.isSneaking) {
      if (stateNames.length === 1)
        return player.onScreenDisplay.setActionBar(
          noI18n.error`Block ${block.typeId} has only one state`,
          ActionbarPriority.High,
        )

      const nextStateName = nextValue(stateNames, stateName)
      this.blockLocationCache.set(cacheLocationId, nextStateName)
      this.blockTypeCache.set(cacheTypeId, nextStateName)
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
      noI18n.error`Block ${block.typeId} has no states to change`,
      ActionbarPriority.PvP,
    )
  }

  private getStatesInfo(block: Block) {
    const allStates = block.permutation.getAllStates()
    const stateNames = Object.keys(allStates)
    if (stateNames.length === 0) return

    const cacheTypeId = block.typeId
    const cacheLocationId = Vec.string(block)
    const stateName =
      this.blockLocationCache.get(cacheLocationId) ??
      this.blockTypeCache.get(cacheTypeId) ??
      (stateNames[0] as unknown as string)
    return { stateNames, stateName, allStates, cacheTypeId, cacheLocationId }
  }
}

function nextValue<T>(array: T[], value: T): T {
  return array[array.findIndex(e => e === value) + 1] ?? (array[0] as T)
}

new DebugStick()

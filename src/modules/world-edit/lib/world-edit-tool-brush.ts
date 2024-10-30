import { BlockRaycastHit, ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { isInvalidLocation } from 'lib'
import stringifyError from 'lib/utils/error'
import { worldEditPlayerSettings } from 'modules/world-edit/settings'
import { BlocksSetRef } from '../utils/blocks-set'
import { WorldEditTool } from './world-edit-tool'

interface BrushStorage {
  version: number
  replaceBlocksSet: BlocksSetRef
  replaceMode: string
  size: number
  maxDistance: number
  type: string
}

export abstract class WorldEditToolBrush<MoreStorage extends object> extends WorldEditTool<BrushStorage & MoreStorage> {
  abstract onBrushUse(player: Player, lore: BrushStorage & MoreStorage, hit: BlockRaycastHit): void

  override isOurItemType(lore: ItemStack | ContainerSlot | (BrushStorage & MoreStorage)) {
    if (lore instanceof ItemStack || lore instanceof ContainerSlot) {
      if (!super.isOurItemType(lore)) return false
      lore = this.getStorage(lore)
    }

    if (lore.type !== this.storageSchema.type) return false

    return true
  }

  override onUse(player: Player, item: ItemStack) {
    const settings = worldEditPlayerSettings(player)
    if (settings.enableMobile) return

    const storage = this.getStorage(item)
    if (!this.isOurItemType(storage)) return

    const hit = player.getBlockFromViewDirection({ maxDistance: storage.maxDistance })
    const fail = (reason: string) => player.fail(`§7Кисть§f: §c${reason}`)
    if (!hit) return fail('Блок слишком далеко.')

    try {
      this.onBrushUse(player, storage, hit)
    } catch (e: unknown) {
      if (isInvalidLocation(e)) {
        fail('Блок не прогружен.')
      } else {
        console.error(e)
        fail('Ошибка ' + stringifyError.message.get(e as Error))
      }
    }
  }
}

import { BlockRaycastHit, ItemStack, Player } from '@minecraft/server'
import { isLocationError } from 'lib'
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

  isOurBrush(storage: BrushStorage & MoreStorage) {
    return storage.type === this.storageSchema.type
  }

  override onUse(player: Player, item: ItemStack) {
    const settings = worldEditPlayerSettings(player)
    if (settings.enableMobile) return

    const storage = this.getStorage(item)
    if (!this.isOurBrush(storage)) return

    const hit = player.getBlockFromViewDirection({ maxDistance: storage.maxDistance })
    const fail = (reason: string) => player.fail(`§7Кисть§f: §c${reason}`)
    if (!hit) return fail('Блок слишком далеко.')

    try {
      this.onBrushUse(player, storage, hit)
    } catch (e: unknown) {
      if (isLocationError(e)) {
        fail('Блок не прогружен.')
      } else {
        console.error(e)
        fail('Ошибка ' + stringifyError.message.get(e as Error))
      }
    }
  }
}

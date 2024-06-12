import { BlockRaycastHit, InvalidContainerSlotError, ItemStack, Player } from '@minecraft/server'
import { isInvalidLocation, util } from 'lib'
import { WorldEditPlayerSettings } from 'modules/world-edit/settings'
import { WorldEditTool } from './world-edit-tool'

interface BrushLoreFormat {
  version: number
  replaceBlocksSet: import('modules/world-edit/utils/blocks-set').BlocksSetRef
  size: number
  maxDistance: number
  type: 'brush' | 'smoother'
}

export class BaseBrushTool<AdditionalLore extends object> extends WorldEditTool<BrushLoreFormat & AdditionalLore> {
  displayName: string

  loreFormat: BrushLoreFormat & AdditionalLore

  getToolSlot(player: Player) {
    const slot = super.getToolSlot(player)

    if (typeof slot === 'string') return slot

    if (!this.isOurBrushType(slot))
      return 'Возьмите ' + this.displayName + 'в руку, или выберите пустой слот, чтобы создать!'

    return slot
  }

  getMenuButtonNameColor(player: Player) {
    const slot = player.mainhand()
    if (!this.isOurBrushType(slot)) return '§8'
    return super.getMenuButtonNameColor(player)
  }

  isOurBrushType(lore: this['loreFormat'] | Pick<ItemStack, 'getLore'>) {
    if ('getLore' in lore) {
      try {
        lore = this.parseLore(lore.getLore())
      } catch (e) {
        if (e instanceof InvalidContainerSlotError) return false // No item in the container
        throw e
      }
    }

    if ('type' in this.loreFormat && 'type' in lore && lore.type !== this.loreFormat.type) return false

    return true
  }

  onUse = function onUse(this: BaseBrushTool<AdditionalLore>, player: Player, item: ItemStack) {
    const settings = WorldEditPlayerSettings(player)
    if (settings.enableMobile) return

    const lore = this.parseLore(item.getLore())

    if (!this.isOurBrushType(lore)) return
    const hit = player.getBlockFromViewDirection({
      maxDistance: lore.maxDistance,
    })

    /** @param {string} reason */

    const fail = (reason: string) => player.fail('§7Кисть§f: §c' + reason)

    if (!hit) return fail('Блок слишком далеко.')

    try {
      this.onBrushUse(player, lore, hit)
    } catch (e: unknown) {
      if (isInvalidLocation(e)) {
        fail('Блок не прогружен.')
      } else {
        console.error(e)
        fail('Ошибка ' + util.error.message.get(e as Error))
      }
    }
  }

  onBrushUse(player: Player, lore: BrushLoreFormat & AdditionalLore, hit: BlockRaycastHit) {
    // See implementation in subclass
  }

  clearLoreFormat: BrushLoreFormat & AdditionalLore
}

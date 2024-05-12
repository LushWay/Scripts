import { BlockRaycastHit, ItemStack, Player } from '@minecraft/server'
import { invalidLocation, util } from 'lib'
import { WE_PLAYER_SETTINGS } from 'modules/world-edit/settings'
import { WorldEditTool } from './WorldEditTool'

type BrushLoreFormat = {
  version: number
  replaceBlocksSet: import('modules/world-edit/utils/blocksSet').BlocksSetRef
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
    if ('getLore' in lore) lore = this.parseLore(lore.getLore())
    if ('type' in this.loreFormat && 'type' in lore && lore.type !== this.loreFormat.type) return false

    return true
  }

  onUse = function onUse(this: BaseBrushTool<AdditionalLore>, player: Player, item: ItemStack) {
    const settings = WE_PLAYER_SETTINGS(player)
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
    } catch (e) {
      if (invalidLocation(e)) {
        fail('Блок не прогружен.')
      } else {
        console.error(e)
        fail('Ошибка ' + util.error.message.get(e))
      }
    }
  }

  onBrushUse(player: Player, lore: BrushLoreFormat & AdditionalLore, hit: BlockRaycastHit) {}

  clearLoreFormat: BrushLoreFormat & AdditionalLore
}

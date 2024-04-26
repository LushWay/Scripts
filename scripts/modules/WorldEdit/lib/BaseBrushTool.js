import { ItemStack, LocationInUnloadedChunkError, LocationOutOfWorldBoundariesError, Player } from '@minecraft/server'
import { util } from 'lib.js'
import { WE_PLAYER_SETTINGS } from 'modules/WorldEdit/settings.js'
import { WorldEditTool } from './WorldEditTool.js'

/**
 * @typedef {{
 *  version: number;
 *  replaceBlocksSet: import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef;
 *  size: number;
 *  maxDistance: number;
 *  type: 'brush' | 'smoother'
 *}} BrushLoreFormat
 */

/**
 * @template {object} AdditionalLore
 * @extends {WorldEditTool<BrushLoreFormat & AdditionalLore>}
 */
export class BaseBrushTool extends WorldEditTool {
  /**
   * @param {Player} player
   */
  getToolSlot(player) {
    const slot = super.getToolSlot(player)

    if (typeof slot === 'string') return slot

    if (!this.isOurBrushType(slot))
      return 'Возьмите ' + this.displayName + 'в руку, или выберите пустой слот, чтобы создать!'

    return slot
  }

  /**
   * @param {Player} player
   */
  getMenuButtonNameColor(player) {
    const slot = player.mainhand()
    if (!this.isOurBrushType(slot)) return '§8'
    return super.getMenuButtonNameColor(player)
  }
  /**
   * @param {this['loreFormat'] | Pick<ItemStack, 'getLore'>} lore
   */
  isOurBrushType(lore) {
    if ('getLore' in lore) lore = this.parseLore(lore.getLore())
    if ('type' in this.loreFormat && 'type' in lore && lore.type !== this.loreFormat.type) return false

    return true
  }
  /**
   *
   * @this {BaseBrushTool<AdditionalLore>}
   * @param {Player} player
   * @param {ItemStack} item
   * @returns
   */
  onUse = function onUse(player, item) {
    const settings = WE_PLAYER_SETTINGS(player)
    if (settings.enableMobile) return

    const lore = this.parseLore(item.getLore())
    if (!this.isOurBrushType(lore)) return
    const hit = player.getBlockFromViewDirection({
      maxDistance: lore.maxDistance,
    })

    /** @param {string} reason */
    const fail = reason => player.fail('§7Кисть§f: §c' + reason)

    if (!hit) return fail('Блок слишком далеко.')

    try {
      this.onBrushUse(player, lore, hit)
    } catch (e) {
      if (e instanceof LocationInUnloadedChunkError || e instanceof LocationOutOfWorldBoundariesError) {
        fail('Блок не прогружен.')
      } else {
        util.error(e)
        fail('Ошибка ' + util.error.message.get(e))
      }
    }
  }

  /**
   * @param {Player} player
   * @param {this["clearLoreFormat"]} lore
   * @param {import('@minecraft/server').BlockRaycastHit} hit
   */
  onBrushUse(player, lore, hit) {}

  /**
   * @type {BrushLoreFormat & AdditionalLore}
   */
  clearLoreFormat
}

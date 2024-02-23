import { ItemLockMode, ItemStack, Player, Vector, world } from '@minecraft/server'
import { CUSTOM_ITEMS } from 'config.js'
import { InventoryIntervalAction } from 'lib/Action.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { MessageForm } from 'lib/Form/MessageForm.js'
import { WeakOnlinePlayerMap } from 'lib/WeakPlayerMap.js'
import { util } from 'lib/util.js'
import { createPublicGiveItemCommand } from 'modules/Survival/createPublicGiveItemCommand.js'

export class Menu {
  static createItem(typeId = CUSTOM_ITEMS.menu, name = '§b§lМеню\n§r§f(use)') {
    const item = new ItemStack(typeId).setInfo(
      name,
      '§r§7Возьми в руку и используй §r§7предмет\n\n§r§7Чтобы убрать из инвентаря, напиши в чат: §f.menu'
    )
    item.lockMode = ItemLockMode.inventory
    item.keepOnDeath = true

    return item
  }
  static item = this.createItem()

  /** @private */
  static init() {
    const { give, command } = createPublicGiveItemCommand('menu', this.item, another => {
      if (another.typeId === this.item.typeId || another.typeId.startsWith('sm:compass')) return true
      return false
    })

    this.give = give
    this.command = command

    world.afterEvents.itemUse.subscribe(async ({ source: player, itemStack }) => {
      if (itemStack.typeId !== this.item.typeId || !(player instanceof Player)) return

      util.catch(() => {
        const menu = this.open(player)
        if (menu) menu.show(player)
      })
    })
  }
  /**
   * Function that gets called when menu item is used
   * @param {import("@minecraft/server").Player} player
   * @returns {false | ActionForm}
   */
  static open(player) {
    new MessageForm('Меню выключено', 'Все еще в разработке').show(player)

    return false
  }
}

// @ts-expect-error Static init
Menu.init()

export class Compass {
  /**
   * Sets compass target for player to provided location
   * @param {Player} player - Player to set compass for
   * @param {Vector3 | undefined} location - Compass target location. Use undefined to remove
   */
  static setFor(player, location) {
    if (location) this.players.set(player, location)
    else this.players.delete(player)
  }

  /**
   * @private
   */
  static items = new Array(32).fill(null).map((_, i) => {
    return Menu.createItem(CUSTOM_ITEMS.compassPrefix + i, '§r§l§6Цель')
  })

  /**
   * Map of player as key and compass target as value
   * @type {WeakOnlinePlayerMap<Vector3>}
   * @private
   */
  static players = new WeakOnlinePlayerMap()

  /**
   * @private
   */
  static action = InventoryIntervalAction.subscribe(({ player, slot }) => {
    if (!this.players.has(player)) return
    if (!slot.typeId?.startsWith(CUSTOM_ITEMS.compassPrefix) && slot.typeId !== CUSTOM_ITEMS.menu) return

    const target = this.players.get(player)
    if (!target) return

    const direction = this.getCompassIndex(player.getViewDirection(), player.location, target)
    const typeId = CUSTOM_ITEMS.compassPrefix + direction
    if (slot.typeId === typeId) return

    // TODO Make sure item exists lol
    slot.setItem(this.items[direction])
  })

  /**
   * @private
   * @param {Vector3} view
   * @param {Vector3} origin
   * @param {Vector3} target
   */
  static getCompassIndex(view, origin, target) {
    const v = Vector.multiply(view, { x: 1, y: 0, z: 1 }).normalized()
    const ot = Vector.multiply(Vector.subtract(target, origin), { x: 1, y: 0, z: 1 }).normalized()
    const cos = Vector.dot(v, ot)
    const sin = Vector.dot(Vector.cross(ot, v), Vector.up)
    const angle = Math.atan2(sin, cos)
    return Math.floor((16 * angle) / Math.PI + 16) || 0
  }
}

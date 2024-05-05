import { ItemLockMode, ItemStack, ItemTypes, Player, Vector, world } from '@minecraft/server'
import { InventoryIntervalAction } from 'lib/Action.js'
import { CUSTOM_ITEMS } from 'lib/Assets/config.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { MessageForm } from 'lib/Form/MessageForm.js'
import { WeakOnlinePlayerMap } from 'lib/WeakPlayerMap.js'
import { util } from 'lib/util.js'

export class Menu {
  /** @type {[string, string]} */
  static settings = ['Меню\n§7Разные настройки интерфейсов и меню в игре', 'menu']

  static createItem(typeId = CUSTOM_ITEMS.menu, name = '§b§lМеню\n§r§f(use)') {
    if (!ItemTypes.get(typeId)) throw new TypeError('Unknown item type: ' + typeId)
    const item = new ItemStack(typeId).setInfo(
      name,
      '§r§7Возьми в руку и используй §r§7предмет\n\n§r§7Чтобы убрать из инвентаря, напиши в чат: §f.menu',
    )
    item.lockMode = ItemLockMode.inventory
    item.keepOnDeath = true

    return item.clone()
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

    world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
      if (!(player instanceof Player)) return
      if (itemStack.typeId !== this.item.typeId && !itemStack.typeId.startsWith(CUSTOM_ITEMS.compassPrefix)) return

      util.catch(() => {
        const menu = this.open(player)
        if (menu) menu.show(player)
      })
    })
  }

  /**
   * Function that gets called when menu item is used
   *
   * @param {import('@minecraft/server').Player} player
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
   *
   * @param {Player} player - Player to set compass for
   * @param {Vector3 | undefined} location - Compass target location. Use undefined to remove
   */
  static setFor(player, location) {
    if (location) this.players.set(player, location)
    else this.players.delete(player)
  }

  /** @private */
  static items = new Array(32).fill(null).map((_, i) => {
    return Menu.createItem(CUSTOM_ITEMS.compassPrefix + i, '§r§l§6Цель\n§r§7(use)')
  })

  /**
   * Map of player as key and compass target as value
   *
   * @private
   * @type {WeakOnlinePlayerMap<Vector3>}
   */
  static players = new WeakOnlinePlayerMap()

  /** @private */
  static action = InventoryIntervalAction.subscribe(({ player, slot }) => {
    const isMenu = slot.typeId === CUSTOM_ITEMS.menu
    if (!slot.typeId?.startsWith(CUSTOM_ITEMS.compassPrefix) && !isMenu) return

    const target = this.players.get(player)
    if (!target) {
      if (isMenu) return

      return slot.setItem(Menu.item)
    }

    if (!Vector.valid(target.value)) return

    const direction = this.getCompassIndex(player.getViewDirection(), player.location, target.value)
    const typeId = CUSTOM_ITEMS.compassPrefix + direction
    if (slot.typeId === typeId || typeof direction !== 'number') return

    const item = this.items[direction]
    try {
      if (item) slot.setItem(item)
    } catch (e) {}
  })

  /**
   * @private
   * @param {Vector3} view
   * @param {Vector3} origin
   * @param {Vector3} target
   */
  static getCompassIndex(view, origin, target) {
    if (!Vector.valid(view)) return
    const v = Vector.multiply(view, { x: 1, y: 0, z: 1 }).normalized()
    const ot = Vector.multiply(Vector.subtract(target, origin), { x: 1, y: 0, z: 1 }).normalized()
    const cos = Vector.dot(v, ot)
    const sin = Vector.dot(Vector.cross(ot, v), Vector.up)
    const angle = Math.atan2(sin, cos)
    return Math.floor((16 * angle) / Math.PI + 16) || 0
  }
}

/**
 * @param {string} name
 * @param {ItemStack} itemStack
 * @param {ItemStack['is']} [is]
 */

export function createPublicGiveItemCommand(name, itemStack, is = itemStack.is.bind(itemStack)) {
  const itemNameTag = itemStack.nameTag?.split('\n')[0]

  /**
   * Gives player an item
   *
   * @param {Player} player
   * @param {object} [o]
   * @param {'tell' | 'ensure'} [o.mode]
   */
  function give(player, { mode = 'tell' } = {}) {
    const { container } = player
    if (!container) return
    const items = container.entries().filter(([_, item]) => item && is(item))

    if (mode === 'tell') {
      if (items.length) {
        for (const [i] of items) container.setItem(i, void 0)
        player.info('§c- ' + itemNameTag)
      } else {
        container.addItem(itemStack)
        player.info('§a+ ' + itemNameTag)
      }
    } else if (mode === 'ensure') {
      if (!items.length) {
        container.addItem(itemStack)
      }
    }
  }

  const command = new Command(name)
    .setDescription(`Выдает или убирает ${itemNameTag}§r§7§o из инвентаря`)
    .setGroup('public')
    .executes(ctx => {
      give(ctx.player)
    })

  return {
    give,
    command,
    /**
     * Alias to {@link give}(player, { mode: 'ensure' })
     *
     * @param {Player} player
     */
    ensure: player => give(player, { mode: 'ensure' }),
  }
}

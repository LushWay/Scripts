import { ContainerSlot, ItemLockMode, ItemStack, ItemTypes, Player, world } from '@minecraft/server'
import { InventoryInterval } from 'lib/action'
import { CustomItems } from 'lib/assets/config'
import { MessageForm } from 'lib/form/message'
import { util } from 'lib/util'
import { Vector } from 'lib/vector'
import { WeakPlayerMap, WeakPlayerSet } from 'lib/weak-player-storage'
import { ActionForm } from '../form/action'

export class Menu {
  static settings: [string, string] = ['Меню\n§7Разные настройки интерфейсов и меню в игре', 'menu']

  static createItem(typeId: string = CustomItems.Menu, name = '§b§lМеню\n§r§f(use)') {
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

  static command

  static give

  static {
    const { give, command } = createPublicGiveItemCommand('menu', this.item, another => {
      if (another.typeId === this.item.typeId || another.typeId.startsWith('sm:compass')) return true
      return false
    })

    this.give = give

    this.command = command

    world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
      if (!(player instanceof Player)) return
      if (itemStack.typeId !== this.item.typeId && !itemStack.typeId.startsWith(CustomItems.CompassPrefix)) return

      util.catch(() => {
        const menu = this.open(player)

        if (menu) menu.show(player)
      })
    })
  }

  static open(player: Player): ActionForm | false {
    new MessageForm('Меню выключено', 'Все еще в разработке').show(player)

    return false
  }
}

export class Compass {
  /**
   * Sets compass target for player to provided location
   *
   * @param player - Player to set compass for
   * @param location - Compass target location. Use undefined to remove
   */
  static setFor(player: Player, location: Vector3 | undefined) {
    if (location) this.players.set(player, location)
    else this.players.delete(player)
  }

  private static items = new Array(32).fill(null).map((_, i) => {
    return Menu.createItem(`${CustomItems.CompassPrefix}${i}`, '§r§l§6Цель\n§r§7(use)')
  })

  /** Map of player as key and compass target as value */
  private static players = new WeakPlayerMap<Vector3>()

  static readonly forceHide = new WeakPlayerSet()

  static {
    InventoryInterval.slots.subscribe(({ player, slot, i }) => {
      const isMainhand = i === player.selectedSlotIndex
      this.setMenu(slot, player, isMainhand)
    })

    InventoryInterval.offhand.subscribe(({ player, slot }) => {
      this.setMenu(slot, player, true)
    })
  }

  private static setMenu(slot: ContainerSlot, player: Player, isHand: boolean) {
    const isMenu = slot.typeId === CustomItems.Menu
    const isCompass = slot.typeId?.startsWith(CustomItems.CompassPrefix)

    if (!isCompass && !isMenu) {
      if (isHand) player.setProperty('sm:minimap', false)
      return
    } else if (isHand) {
      if (!this.forceHide.has(player)) player.setProperty('sm:minimap', true)
    }

    const target = this.players.get(player)
    if (!target) {
      if (isCompass) slot.setItem(Menu.item)
      return
    }

    const item = this.getCompassItem(player.getViewDirection(), player.location, target)
    if (!item) return
    if (slot.typeId === item.typeId) return

    try {
      slot.setItem(item)
    } catch (e) {}
  }

  private static getCompassItem(view: Vector3, origin: Vector3, target: Vector3) {
    const i = this.getCompassIndex(view, origin, target)
    if (typeof i === 'number') return this.items[i]
  }

  private static getCompassIndex(view: Vector3, origin: Vector3, target: Vector3) {
    if (!Vector.valid(view) || !Vector.valid(target) || !Vector.valid(origin)) return

    const v = Vector.multiply(view, { x: 1, y: 0, z: 1 }).normalized()
    const ot = Vector.multiply(Vector.subtract(target, origin), { x: 1, y: 0, z: 1 }).normalized()
    const cos = Vector.dot(v, ot)
    const sin = Vector.dot(Vector.cross(ot, v), Vector.up)
    const angle = Math.atan2(sin, cos)
    return Math.floor((16 * angle) / Math.PI + 16) || 0
  }
}

export function createPublicGiveItemCommand(
  name: string,
  itemStack: ItemStack,
  is = itemStack.is.bind(itemStack) as ItemStack['is'],
) {
  const itemNameTag = itemStack.nameTag?.split('\n')[0]

  /** Gives player an item */
  function give(player: Player, { mode = 'tell' }: { mode?: 'tell' | 'ensure' } = {}) {
    const { container } = player
    if (!container) return

    const items = container.entries().filter(([_, item]) => item && is(item))

    if (mode === 'tell') {
      if (items.length) {
        for (const [i] of items) container.setItem(i, void 0)
        player.info(`§c- ${itemNameTag}`)
      } else {
        container.addItem(itemStack)
        player.info(`§a+ ${itemNameTag}`)
      }
    } else {
      if (!items.length) {
        container.addItem(itemStack)
      }
    }
  }

  const command = new Command(name)
    .setDescription(`Выдает или убирает ${itemNameTag}§r§7§o из инвентаря`)
    .setGroup('public')
    .setPermissions('member')
    .executes(ctx => {
      give(ctx.player)
    })

  return {
    give,
    command,
    /** Alias to {@link give}(player, { mode: 'ensure' }) */
    ensure: (player: Player) => give(player, { mode: 'ensure' }),
  }
}

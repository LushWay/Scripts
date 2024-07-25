import { ContainerSlot, EquipmentSlot, ItemLockMode, ItemStack, ItemTypes, Player, world } from '@minecraft/server'
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

  static itemStack = this.createItem()

  static item = createPublicGiveItemCommand('menu', this.itemStack, another => this.isMenu(another))

  static {
    world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
      if (!(player instanceof Player)) return
      if (!this.isMenu(itemStack)) return

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

  static isCompass(slot: Pick<ContainerSlot, 'typeId'>) {
    return !!slot.typeId?.startsWith(CustomItems.CompassPrefix)
  }

  static isMenu(slot: Pick<ContainerSlot, 'typeId'>) {
    return this.isCompass(slot) || slot.typeId === this.itemStack.typeId
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

  private static slotInfo(player: Player, slot: ContainerSlot, i: number) {
    const isMainhand = player.selectedSlotIndex === i
    const isMenu = Menu.isMenu(slot)
    const offhand = isMainhand && player.getComponent('equippable')?.getEquipmentSlot(EquipmentSlot.Offhand)
    const isOffhandMenu = offhand && Menu.isMenu(offhand)

    return { isMenu, isMainhand, isOffhandMenu, offhand }
  }

  static {
    InventoryInterval.slots.subscribe(({ player, slot, i }) => {
      const { isMainhand, isMenu, isOffhandMenu, offhand } = this.slotInfo(player, slot, i)

      if (isMenu) this.updateCompassInSlot(slot, player)

      if ((isMainhand && isMenu) || isOffhandMenu) {
        if (!this.forceHide.has(player)) player.setProperty('lw:minimap', true)
      } else {
        if (isMainhand) player.setProperty('lw:minimap', false)
        return
      }

      if (isMainhand && offhand) this.updateCompassInSlot(offhand, player)
    })
  }

  private static updateCompassInSlot(slot: ContainerSlot, player: Player) {
    if (!Menu.isMenu(slot)) return

    const target = this.players.get(player)
    if (!target) {
      if (Menu.isCompass(slot)) slot.setItem(Menu.itemStack)
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
    if (!Vector.valid(view) || !Vector.valid(target) || !Vector.valid(origin)) return

    const v = Vector.multiply(view, { x: 1, y: 0, z: 1 }).normalized()
    const ot = Vector.multiply(Vector.subtract(target, origin), { x: 1, y: 0, z: 1 }).normalized()
    const cos = Vector.dot(v, ot)
    const sin = Vector.dot(Vector.cross(ot, v), Vector.up)
    const angle = Math.atan2(sin, cos)
    const i = Math.floor((16 * angle) / Math.PI + 16) || 0

    if (typeof i === 'number') return this.items[i]
  }
}

export function createPublicGiveItemCommand(name: string, itemStack: ItemStack, is = itemStack.is.bind(itemStack)) {
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

import { ContainerSlot, EquipmentSlot, ItemLockMode, ItemStack, ItemTypes, Player, world } from '@minecraft/server'
import { InventoryInterval } from 'lib/action'
import { Items } from 'lib/assets/custom-items'
import { MessageForm } from 'lib/form/message'
import { util } from 'lib/util'
import { Vec } from 'lib/vector'
import { WeakPlayerMap, WeakPlayerSet } from 'lib/weak-player-storage'
import { ActionForm } from '../form/action'
import { MinimapNpc, resetMinimapNpcPosition, setMinimapEnabled, setMinimapNpcPosition } from './minimap'

export class Menu {
  static settings: [string, string] = ['Меню\n§7Разные настройки интерфейсов и меню в игре', 'menu']

  static createItem(typeId: string = Items.Menu, name?: string) {
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

  static item = createPublicGiveItemCommand('menu', this.itemStack, another => this.isMenu(another), 'меню')

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
    return !!slot.typeId?.startsWith(Items.CompassPrefix)
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
    if (location) {
      this.players.set(player, location)
      setMinimapNpcPosition(player, MinimapNpc.Quest, location.x, location.z)
    } else {
      this.players.delete(player)
      if (player.isValid) resetMinimapNpcPosition(player, MinimapNpc.Quest)
    }
  }

  private static items = new Array(32).fill(null).map((_, i) => {
    return Menu.createItem(`${Items.CompassPrefix}${i}`, '§r§l§6Цель\n§r§7(use)')
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
        if (!this.forceHide.has(player)) setMinimapEnabled(player, true)
      } else {
        if (isMainhand && !player.isSimulated()) setMinimapEnabled(player, false)
        return
      }

      if (isMainhand && offhand) this.updateCompassInSlot(offhand, player)
    })
  }

  private static updateCompassInSlot(slot: ContainerSlot, player: Player) {
    if (!Menu.isMenu(slot)) return

    const target = this.players.get(player)
    if (!target || player.database.inv === 'spawn') {
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
    if (!Vec.isValid(view) || !Vec.isValid(target) || !Vec.isValid(origin)) return

    const v = Vec.multiplyVec(view, { x: 1, y: 0, z: 1 }).normalized()
    const ot = Vec.subtract(target, origin).multiplyVec({ x: 1, y: 0, z: 1 }).normalized()
    const cos = Vec.dot(v, ot)
    const sin = Vec.dot(Vec.cross(ot, v), Vec.up)
    const angle = Math.atan2(sin, cos)
    const i = Math.floor((16 * angle) / Math.PI + 16) || 0

    if (typeof i === 'number') return this.items[i]
  }
}

export function createPublicGiveItemCommand(
  name: string,
  itemStack: ItemStack,
  is = itemStack.is.bind(itemStack),
  itemNameTag = itemStack.nameTag?.split('\n')[0],
) {
  /** Gives player an item */
  function give(player: Player, { mode = 'tell' }: { mode?: 'tell' | 'ensure' } = {}) {
    const { container } = player
    if (!container) return

    const offhand = player.getComponent('equippable')?.getEquipmentSlot(EquipmentSlot.Offhand)
    const items = container
      .entries()
      .map(([i, item]) => ({ item, remove: () => container.setItem(i, void 0) }))
      .concat([{ item: offhand?.getItem(), remove: () => offhand?.setItem(void 0) }])
      .filter(({ item }) => item && is(item))

    if (mode === 'tell') {
      if (items.length) {
        items.forEach(e => e.remove())
        player.info(`§c-${itemNameTag}`)
      } else {
        container.addItem(itemStack)
        player.info(`§a+${itemNameTag}`)
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

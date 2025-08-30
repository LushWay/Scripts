import { ContainerSlot, EntityComponentTypes, EquipmentSlot, ItemStack, Player } from '@minecraft/server'
import { enchantData } from 'lib/assets/texture-data'
import { ChestForm } from 'lib/form/chest'
import { BUTTON } from 'lib/form/utils'
import { langToken, translateEnchantment, translateToken } from 'lib/i18n/lang'

export type ItemFilter = (itemStack: ItemStack) => boolean
export type OnSelect = (itemSlot: ContainerSlot, itemStack: ItemStack) => void

export const eqSlots = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
  EquipmentSlot.Offhand,
]

export function selectItemForm(
  itemFilter: ItemFilter,
  player: Player,
  text: Text,
  select: OnSelect,
  back?: VoidFunction,
) {
  const { container } = player
  if (!container) return
  const chestForm = new ChestForm('45').title(text.to(player.lang)).pattern([0, 0], ['<-     -?'], {
    '<': {
      icon: BUTTON['<'],
      callback: back,
    },
    '-': {
      icon: 'textures/blocks/glass',
    },
    '?': {
      icon: BUTTON['?'],
    },
  })
  const equipment = player.getComponent(EntityComponentTypes.Equippable)
  if (equipment) {
    for (const [i, slotId] of eqSlots.entries()) {
      const slot = equipment.getEquipmentSlot(slotId)
      addItem(slot, player, chestForm, i + 2, select, itemFilter)
    }
  }
  for (const [i, slot] of container.slotEntries()) {
    addItem(slot, player, chestForm, i + 9, select, itemFilter)
  }

  chestForm.show(player)
}

function addItem(
  slot: ContainerSlot,
  player: Player,
  chestForm: ChestForm,
  i: number,
  select: OnSelect,
  itemFilter: (itemStack: ItemStack) => boolean,
) {
  const item = slot.getItem()
  if (!item) return
  if (!itemFilter(item)) return

  const typeId = item.typeId

  // Enchant data does not applies for the custom items becuase they don't use aux ids
  const enchanted = enchantData[typeId] ?? !!item.enchantable?.getEnchantments().length
  const nameTagPrefix = enchanted ? '§b' : ''
  const lore = [...enchantmentsToLore(item, player), ...slot.getLore(), ...addItemDurabilityToLore(item)]

  chestForm.button({
    slot: i,
    icon: typeId,
    nameTag: nameTagPrefix + translateToken(langToken(typeId), player.lang),
    amount: slot.amount,
    enchanted,
    lore,
    callback: () => select(slot, item),
  })
}

function enchantmentsToLore(item: ItemStack, player: Player): string[] {
  if (item.enchantable) {
    return item.enchantable.getEnchantments().map(e => translateEnchantment(e, player.lang))
  } else return []
}

function addItemDurabilityToLore(item: ItemStack) {
  if (item.durability) {
    const max = item.durability.maxDurability
    const dmg = item.durability.damage
    const mod = 10 / max
    const damaged = dmg * mod
    const green = (max - dmg) * mod
    const dmgP = 100 - (dmg / max) * 100
    const color = dmgP > 80 ? '§a' : dmgP > 30 ? '§e' : '§c'

    return [' ', `${color}${'▀'.repeat(green)}§8${'▀'.repeat(damaged)} ${~~dmgP}%`]
  } else return []
}

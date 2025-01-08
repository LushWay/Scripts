import { Container, ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { enchantData } from 'lib/assets/texture-data'
import { ChestForm } from 'lib/form/chest'
import { BUTTON } from 'lib/form/utils'
import { MaybeRawText, t } from 'lib/text'
import { langToken, rawTextToString, translateEnchantment, translateToken } from 'lib/utils/lang'

export type ItemFilter = (itemStack: ItemStack) => boolean
export type OnSelect = (itemSlot: ContainerSlot, itemStack: ItemStack) => void

export function selectItemForm(
  itemFilter: ItemFilter,
  player: Player,
  text: MaybeRawText,
  select: OnSelect,
  back?: VoidFunction,
) {
  const { container } = player
  if (!container) return
  const chestForm = new ChestForm('45').title(t.options({ unit: '§0' }).raw`${text}`).pattern([0, 0], ['<-------?'], {
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
  for (const [i, item] of container.entries().filter(([, item]) => item && itemFilter(item))) {
    if (!item) continue

    addItem(item, player, chestForm, i, select, container)
  }

  chestForm.show(player)
}

function addItem(
  item: ItemStack,
  player: Player,
  chestForm: ChestForm,
  i: number,
  select: OnSelect,
  container: Container,
) {
  // Enchant data does not applies for the custom items becuase they don't use aux ids
  const enchanted = enchantData[item.typeId] ?? !!item.enchantable?.getEnchantments().length
  const nameTagPrefix = enchanted ? '§b' : ''
  const lore = [...enchantmentsToLore(item, player), ...item.getLore(), ...addItemDurabilityToLore(item)]

  chestForm.button({
    slot: i + 9,
    icon: item.typeId,
    nameTag: nameTagPrefix + translateToken(langToken(item.typeId), player.lang),
    amount: item.amount,
    enchanted,
    lore,
    callback: () => select(container.getSlot(i), item),
  })
}

function enchantmentsToLore(item: ItemStack, player: Player): string[] {
  if (item.enchantable) {
    return item.enchantable.getEnchantments().map(e => rawTextToString(translateEnchantment(e), player.lang))
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

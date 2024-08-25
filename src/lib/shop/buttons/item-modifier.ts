import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { BUTTON, ChestForm, getAuxOrTexture } from 'lib'
import { MaybeRawText, t } from 'lib/text'
import { langToken, rawTextToString, translateEnchantment, translateToken } from 'lib/utils/lang'
import { Cost, MultiCost, ShouldHaveItemCost } from '../cost'
import { ShopForm, ShopFormSection, ShopProduct } from '../form'
import { Shop } from '../shop'

type ItemFilter = (itemStack: ItemStack) => boolean
type OnSelect = (itemSlot: ContainerSlot, itemStack: ItemStack) => void

export function createItemModifier(
  shopForm: ShopForm,
  name: ShopProduct['name'],
  cost: Cost,
  itemFilterName: MaybeRawText,
  itemFilter: ItemFilter,
  modifyItem: (itemSlot: ContainerSlot, itemStack: ItemStack, successBuyText: MaybeRawText) => boolean | void,
) {
  shopForm.product(
    name,
    new MultiCost(ShouldHaveItemCost.createFromFilter(itemFilter, itemFilterName), cost),
    (player, text, success, successBuyText) => {
      selectItem(
        itemFilter,
        player,
        text,

        // OnSelect
        (slot, item) => {
          cost.buy(player)
          if (modifyItem(slot, item, successBuyText) !== false) success()
        },

        // Back
        () => shopForm.show(player, undefined, undefined),
      )
      return false
    },
  )
}

export type ShopMenuWithSlotCreate = (
  form: ShopFormSection,
  slot: ContainerSlot,
  itemStack: ItemStack,
  player: Player,
  addSelectItem: VoidFunction,
) => void

export function createItemModifierSection(
  shopForm: ShopForm,
  shop: Shop,

  name: MaybeRawText,
  itemFilterName: MaybeRawText,
  itemFilter: ItemFilter,
  onOpen: ShopMenuWithSlotCreate,
  manualSelectItemButton = false,
) {
  shopForm.product(name, ShouldHaveItemCost.createFromFilter(itemFilter, itemFilterName), (player, text) => {
    const back = () => shopForm.show(player, undefined, undefined)

    const select = () =>
      selectItem(
        itemFilter,
        player,
        text,

        // OnSelect
        (slot, item) => {
          ShopForm.showSection(
            name,
            ShopForm.toShopFormSection(shopForm),
            shop,
            player,

            // Back
            back,

            (form, player) => {
              const itemStack = slot.getItem()

              if (!itemStack) return
              item = itemStack

              form.body = () =>
                t.raw`Зачарования:\n${{
                  rawtext: item.enchantable
                    ?.getEnchantments()
                    .map(e => [translateEnchantment(e), { text: '\n' }])
                    .flat(),
                }}`

              const addSelectItem = () =>
                form.button(
                  t.raw`Выбранный предмет: ${{ translate: langToken(item) }}\n§7Нажмите, чтобы сменить`,
                  getAuxOrTexture(item.typeId, !!item.enchantable?.getEnchantments().length),
                  select,
                )

              if (!manualSelectItemButton) addSelectItem()
              onOpen(form, slot, item, player, addSelectItem)
            },
          )
        },

        // Back
        back,
      )

    select()
    return false
  })
}

export function selectItem(
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

    let nameTagPrefix = ''
    let lore: string[] = []

    if (item.enchantable) {
      nameTagPrefix = '§b'
      lore = lore.concat(
        item.enchantable.getEnchantments().map(e => rawTextToString(translateEnchantment(e), player.lang)),
      )
    }

    lore = lore.concat(item.getLore())

    if (item.durability) {
      const max = item.durability.maxDurability
      const dmg = item.durability.damage
      const mod = 10 / max
      const damaged = dmg * mod
      const green = (max - dmg) * mod
      const dmgP = 100 - (dmg / max) * 100
      const color = dmgP > 80 ? '§a' : dmgP > 30 ? '§e' : '§c'

      lore.push(' ')
      lore.push(`${color}${'▀'.repeat(green)}§8${'▀'.repeat(damaged)} ${~~dmgP}%`)
    }

    chestForm.button({
      slot: i + 9,
      icon: item.typeId,
      nameTag: nameTagPrefix + translateToken(player.lang, langToken(item.typeId)),
      amount: item.amount,
      enchanted: !!item.enchantable?.getEnchantments().length,
      lore,
      callback: () => select(container.getSlot(i), item),
    })
  }

  chestForm.show(player)
}

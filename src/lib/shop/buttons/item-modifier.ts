import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { BUTTON, ChestForm, getAuxOrTexture, langKey, translateEnchantment, typeIdToReadable } from 'lib'
import { MaybeRawText, t } from 'lib/text'
import { Cost, MultiCost, ShouldHaveItemCost } from '../cost'
import { ShopForm, ShopFormSection, ShopProduct } from '../form'
import { Shop } from '../shop'

type ItemFilter = (itemStack: ItemStack) => boolean
type OnSelect = (itemSlot: ContainerSlot, itemStack: ItemStack) => void

export function createItemModifier(
  shopForm: ShopForm,
  name: ShopProduct['name'],
  cost: Cost,
  itemFilter: ItemFilter,
  modifyItem: OnSelect,
) {
  shopForm.product(
    name,
    new MultiCost(ShouldHaveItemCost.createFromFilter(itemFilter, 'Выберите '), cost),
    (player, text, success) => {
      selectItem(
        itemFilter,
        player,
        text,

        // OnSelect
        (slot, item) => {
          cost.buy(player)
          modifyItem(slot, item)
          success()
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
                  t.raw`Выбранный предмет: ${{ translate: langKey(item) }}\n§7Нажмите, чтобы сменить`,
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
    chestForm.button({
      slot: i + 9,
      icon: item.typeId,
      nameTag: typeIdToReadable(item.typeId), // TODO: use '%' + langKey(item.typeId),
      amount: item.amount,
      enchanted: !!item.enchantable?.getEnchantments().length,
      lore: (item.enchantable
        ? item.enchantable.getEnchantments().map(e => `${typeIdToReadable(e.type.id)}: ${e.level}`)
        : []
      ).concat(item.getLore()),
      callback: () => select(container.getSlot(i), item),
    })
  }

  chestForm.show(player)
}

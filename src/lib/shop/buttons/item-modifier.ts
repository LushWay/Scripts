import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { getAuxOrTexture } from 'lib/form/chest'
import { ItemFilter, OnSelect, selectItemForm } from 'lib/form/select-item'
import { MaybeRawText, t } from 'lib/text'
import { langToken, translateEnchantment } from 'lib/utils/lang'
import { Cost, MultiCost, ShouldHaveItemCost } from '../cost'
import { ShopForm, ShopFormSection } from '../form'
import { ProductName } from '../product'
import { Shop } from '../shop'

export function createItemModifier(
  shopForm: ShopForm,
  name: ProductName,
  cost: Cost,
  itemFilterName: MaybeRawText,
  itemFilter: ItemFilter,
  modifyItem: (itemSlot: ContainerSlot, itemStack: ItemStack, successBuyText: MaybeRawText) => boolean | void,
) {
  shopForm
    .product()
    .name(name)
    .cost(new MultiCost(ShouldHaveItemCost.createFromFilter(itemFilter, itemFilterName), cost))
    .onBuy((player, text, success, successBuyText) => {
      selectItemForm(
        itemFilter,
        player,
        text,

        // OnSelect
        (slot, item) => {
          cost.take(player)
          if (modifyItem(slot, item, successBuyText) !== false) success()
        },

        // Back
        () => shopForm.show(),
      )
      return false
    })
    .setTakeCost(true)
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
  shopForm
    .product()
    .name(name)
    .cost(ShouldHaveItemCost.createFromFilter(itemFilter, itemFilterName))
    .onBuy((player, text) => {
      const back = () => shopForm.show()

      const select = () =>
        selectItemForm(
          itemFilter,
          player,
          text,

          // OnSelect
          onSelect(name, shopForm, shop, player, back, select, manualSelectItemButton, onOpen),

          // Back
          back,
        )

      select()
      return false
    })
}

function onSelect(
  name: MaybeRawText,
  shopForm: ShopForm,
  shop: Shop,
  player: Player,
  back: () => void,
  select: () => void,
  manualSelectItemButton: boolean,
  onOpen: ShopMenuWithSlotCreate,
): OnSelect {
  return (slot, item) => {
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
  }
}

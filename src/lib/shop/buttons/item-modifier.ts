import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { getAuxOrTexture } from 'lib/form/chest'
import { ItemFilter, OnSelect, selectItemForm } from 'lib/form/select-item'
import { translateEnchantment, translateTypeId } from 'lib/i18n/lang'
import { Text, t } from 'lib/i18n/text'
import { Cost, MultiCost, ShouldHaveItemCost } from '../cost'
import { ShopForm, ShopFormSection } from '../form'
import { ProductName } from '../product'
import { Shop } from '../shop'

export function createItemModifier(
  shopForm: ShopForm,
  name: ProductName,
  cost: Cost,
  itemFilterName: Text,
  itemFilter: ItemFilter,
  modifyItem: (itemSlot: ContainerSlot, itemStack: ItemStack, successBuyText: Text) => boolean | void,
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
    .setTakeCost(false)
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

  name: Text,
  itemFilterName: Text,
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
  name: Text,
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

        // TODO Check colors
        // TODO Check lang for potions etc

        form.body = () =>
          t`Зачарования:\n${item.enchantable
            ?.getEnchantments()
            .map(e => translateEnchantment(e, player.lang))
            .join('\n')}`

        const addSelectItem = () =>
          form.button(
            t`Выбранный предмет: ${translateTypeId(item.typeId, player.lang)}\nНажмите, чтобы сменить`,
            getAuxOrTexture(item.typeId, !!item.enchantable?.getEnchantments().length),
            select,
          )

        if (!manualSelectItemButton) addSelectItem()
        onOpen(form, slot, item, player, addSelectItem)
      },
    )
  }
}

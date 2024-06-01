import { ContainerSlot, ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { MoneyCost, MultiCost } from 'lib/cost'
import { Shop } from 'lib/shop'

export default gunsmith

function gunsmith(group: string) {
  const { shop, entity } = Shop.npc({
    group,
    id: 'gunsmith',
    name: 'Оружейник',
    dimensionId: 'overworld',
    body: () => 'Чего пожелаешь?',
  })

  shop.menu(form => {
    form
      .addSection('Улучшить оружие', form => {
        form.addItemModifier(
          'Улучшить незеритовый меч до алмазного',
          new MultiCost().item(i.NetheriteIngot, 10).item(i.GoldIngot, 5).item(i.OakPlanks, 100).money(1000),
          item => item.typeId === i.DiamondSword,
          slot => upgradeDiamondSwordToNetherite(slot),
        )

        form.addItemStack(new ItemStack(i.DiamondSword), new MoneyCost(100))
      })
      .addSection('Улучшить броню', form => {
        form
      })
  })

  return { shop, entity }
}

function upgradeDiamondSwordToNetherite(slot: ContainerSlot) {
  const slotItem = slot.getItem()
  if (!slotItem) return
  const item = new ItemStack(i.NetheriteSword)
  item.setLore(slot.getLore())

  if (item.enchantable && slotItem.enchantable)
    item.enchantable?.addEnchantments(slotItem.enchantable?.getEnchantments())

  if (item.durability && slotItem.durability) item.durability.damage = slotItem.durability.damage
  slot.setItem(item)
}

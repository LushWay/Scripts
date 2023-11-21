import { world } from '@minecraft/server'
import { MinecraftEnchantmentTypes } from '../lib/List/enchantments.js'
import { Enchantments } from '../modules/Server/Class/Enchantments.js'

new Command({
  name: 'enchant',
  description: 'Зачаровывает предмет',
  role: 'admin',
})
  .array('enchantName', Object.keys(MinecraftEnchantmentTypes), true)
  .int('level', true)
  .executes((ctx, enchant, level) => {
    if (!enchant)
      return ctx.reply(Object.keys(MinecraftEnchantmentTypes).join('\n'))
    const ench = MinecraftEnchantmentTypes[enchant]

    const mainhand = ctx.sender.mainhand()

    const item = mainhand.getItem()
    if (!item) return ctx.error('No item!')
    const { enchantments } = item.getComponent('enchantments')
    enchantments.removeEnchantment(ench)
    enchantments.addEnchantment(Enchantments.custom[ench][level])

    world.debug('enchants', [...enchantments])
    item.getComponent('enchantments').enchantments = enchantments

    mainhand.setItem(item)
  })

import { world } from '@minecraft/server'
import { Enchantments } from '../lib/Class/Enchantments.js'
import { MinecraftEnchantmentTypes } from '../lib/List/enchantments.js'

new Command({
  name: 'enchant',
  description: 'Зачаровывает предмет',
  role: 'admin',
})
  .array('enchantName', Object.keys(MinecraftEnchantmentTypes), true)
  .int('level', true)
  .executes((ctx, enchant, level) => {
    if (!enchant) return ctx.reply(Object.keys(MinecraftEnchantmentTypes).join('\n'))
    const ench = MinecraftEnchantmentTypes[enchant]

    const mainhand = ctx.sender.mainhand()

    const item = mainhand.getItem()
    if (!item) return ctx.error('No item!')
    const enchs = item.getComponent('enchantments')
    if (!enchs) return ctx.error('A')
    const { enchantments } = enchs
    enchantments.removeEnchantment(ench)
    console.debug({ Enchantments: Enchantments.custom, ench, level })
    enchantments.addEnchantment(Enchantments.custom[ench][level])

    world.debug('enchants', [...enchantments])
    enchs.enchantments = enchantments

    mainhand.setItem(item)
  })

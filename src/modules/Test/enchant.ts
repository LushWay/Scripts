import { world } from '@minecraft/server'
import { MinecraftEnchantmentTypes } from '../../lib/assets/enchantments'
import { Enchantments } from '../../lib/enchantments'

new Command('enchant')
  .setDescription('Зачаровывает предмет')
  .setPermissions('admin')
  .array('enchantName', Object.keys(MinecraftEnchantmentTypes), true)
  .int('level', true)
  .executes((ctx, enchant, level) => {
    if (!enchant) return ctx.reply(Object.keys(MinecraftEnchantmentTypes).join('\n'))

    const ench = MinecraftEnchantmentTypes[enchant]

    const mainhand = ctx.player.mainhand()

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

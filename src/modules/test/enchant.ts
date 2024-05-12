import { world } from '@minecraft/server'
import { MinecraftEnchantmentTypes } from '@minecraft/vanilla-data'
import { Enchantments } from '../../lib/enchantments'

new Command('enchant')
  .setDescription('Зачаровывает предмет')
  .setPermissions('admin')
  .array('enchantName', Object.values(MinecraftEnchantmentTypes), true)
  .int('level', true)
  .executes((ctx, enchant, level) => {
    if (!enchant) return ctx.reply(Object.values(MinecraftEnchantmentTypes).join('\n'))

    const mainhand = ctx.player.mainhand()

    const item = mainhand.getItem()
    if (!item) return ctx.error('No item!')
    const enchantments = item.getComponent('enchantable')
    if (!enchantments) return ctx.error('A')
    enchantments.removeEnchantment(enchant)
    console.debug({ Enchantments: Enchantments.custom, enchant, level })

    enchantments.addEnchantment(Enchantments.custom[enchant][level])

    world.debug('enchants', [...enchantments.getEnchantments()])

    mainhand.setItem(item)
  })

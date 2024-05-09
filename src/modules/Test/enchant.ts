import { world } from '@minecraft/server'
import { Enchantments } from '../../lib/Enchantments'
import { MinecraftEnchantmentTypes } from '../../lib/assets/enchantments'

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

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    enchantments.addEnchantment(Enchantments.custom[ench][level])

    world.debug('enchants', [...enchantments])
    enchs.enchantments = enchantments

    mainhand.setItem(item)
  })

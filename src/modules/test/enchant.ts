import { world } from '@minecraft/server'
import { MinecraftEffectTypes, MinecraftEnchantmentTypes } from '@minecraft/vanilla-data'
import { Enchantments } from '../../lib/enchantments'

new Command('enchant')
  .setDescription('Зачаровывает предмет')
  .setPermissions('admin')
  .array('enchantName', Object.values(MinecraftEnchantmentTypes), true)
  .int('level')
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

new Command('repair')
  .setPermissions('techAdmin')
  .setDescription('Чинит предмет')
  .executes(ctx => {
    const item = ctx.player.mainhand().getItem()
    if (!item) return ctx.error('В руке нет предмета.')

    const durability = item.durability
    if (!durability) return ctx.error('Этот предмет невозможно починить.')

    durability.damage = 0
    ctx.player.mainhand().setItem(item)
  })

new Command('heal')
  .setPermissions('techAdmin')
  .setDescription('Восстанавливает хп')
  .executes(ctx => {
    const item = ctx.player.getComponent('health')
    if (!item) return ctx.error('Вы мертвы.')

    item.resetToMaxValue()
  })

new Command('eat')
  .setPermissions('techAdmin')
  .setDescription('Восстанавливает голод')
  .executes(ctx => {
    ctx.player.addEffect(MinecraftEffectTypes.Saturation, 1, { amplifier: 255 })
  })

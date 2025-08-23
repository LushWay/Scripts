/* i18n-ignore */
import { world } from '@minecraft/server'
import { Enchantments } from 'lib/enchantments'

new Command('enchant')
  .setDescription('Зачаровывает предмет')
  .setPermissions('admin')
  .string('enchantName', true)
  .int('level')
  .executes((ctx, enchant, level) => {
    const ench = enchant && Enchantments.custom[enchant]
    if (!ench) return ctx.reply(Object.keys(Enchantments.custom).join('\n'))

    const mainhand = ctx.player.mainhand()
    const item = mainhand.getItem()
    if (!item) return ctx.error('No item!')

    const enchlevels = ench[level]
    if (!enchlevels) return ctx.error('Level unavailable. Levels:\n' + Object.keys(ench).join('\n'))

    const enchitem = enchlevels[item.typeId]
    if (!enchitem) return ctx.error('Available items:\n' + Object.keys(enchlevels).join('\n'))

    const enchantments = item.getComponent('enchantable')
    if (!enchantments) return ctx.error('Not enchantable!')

    const newitem = enchitem.clone()

    newitem.enchantable?.addEnchantments(enchantments.getEnchantments().filter(e => e.type.id !== enchant))
    newitem.nameTag = item.nameTag
    newitem.amount = item.amount
    if (newitem.durability && item.durability) newitem.durability.damage = item.durability.damage
    newitem.setLore(item.getLore())
    newitem.setCanDestroy(item.getCanDestroy())
    newitem.setCanPlaceOn(item.getCanPlaceOn())
    newitem.keepOnDeath = item.keepOnDeath
    newitem.lockMode = item.lockMode
    for (const prop of item.getDynamicPropertyIds()) newitem.setDynamicProperty(prop, item.getDynamicProperty(prop))

    if (newitem.enchantable) world.debug('enchants', [...newitem.enchantable.getEnchantments()])

    mainhand.setItem(newitem)
  })

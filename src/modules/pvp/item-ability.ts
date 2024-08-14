import { EntityDamageCause, world } from '@minecraft/server'
import { isKeyof, selectByChance } from 'lib'
import { ItemLoreSchema } from 'lib/database/item-stack'

export enum ItemAbility {
  Vampire = 'vamp',
  ExtraDamage = 'dmgx',
  Nothing = '0',
}

const descriptions = {
  [ItemAbility.Vampire]: 'Вампиризм\n\nВосстанавливает вам половину наносимого этим мечом урона',
  [ItemAbility.ExtraDamage]: 'Дополнительный урон\n\n10% шанс сделать двойной урон',
  [ItemAbility.Nothing]: 'Неизвестная',
} satisfies Record<ItemAbility, string>

export const itemAbilitySchema = new ItemLoreSchema('item-ability')
  .property('ability', String)
  .display('Способность', p => (isKeyof(p, descriptions) ? descriptions[p] : descriptions[ItemAbility.Nothing]))
  .build()

new Command('itemability')
  .setDescription('Позволяет получать предмет с кастомной чаркой')
  .setPermissions('techAdmin')
  .array('sword type', ['diamond', 'iron', 'netherite'])
  .array('ability', [ItemAbility.Vampire, ItemAbility.ExtraDamage])
  .executes((ctx, type, ability) => {
    const { item } = itemAbilitySchema.create({ ability }, `minecraft:${type}_sword`)
    ctx.player.container?.addItem(item)
  })

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource: { damagingEntity, cause } }) => {
  if (!damagingEntity?.isPlayer() || !hurtEntity.isPlayer() || cause !== EntityDamageCause.entityAttack) return

  const mainhand = damagingEntity.mainhand()
  const item = mainhand.isValid() && mainhand.getItem()
  const storage = item && itemAbilitySchema.parse(item)
  if (!storage) return

  switch (storage.enchant) {
    case ItemAbility.Vampire: {
      const health = damagingEntity.getComponent('health')
      if (health) {
        const newValue = health.currentValue + damage / 2
        if (newValue > health.effectiveMax) {
          health.resetToMaxValue()
        } else {
          health.setCurrentValue(newValue)
        }
      }
      break
    }
    case ItemAbility.ExtraDamage: {
      if (selectByChance(extraDamage).item) {
        damagingEntity.success('х2 урон!', false)
        hurtEntity.applyDamage(damage, { damagingEntity, cause })
      }
      break
    }
    default: {
      storage.enchant = ItemAbility.Nothing
    }
  }
})

const extraDamage = [
  { chance: 10, item: true },
  { chance: 100, item: false },
]

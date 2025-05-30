import { EntityDamageCause, world } from '@minecraft/server'
import { isKeyof, selectByChance } from 'lib'
import { ItemLoreSchema } from 'lib/database/item-stack'

export enum Ability {
  Vampire = 'vamp',
  ExtraDamage = 'dmgx',
  Nothing = '0',
}

const names = {
  [Ability.Vampire]: 'Вампиризм',
  [Ability.ExtraDamage]: 'Дополнительный урон',
  [Ability.Nothing]: 'Неизвестная',
} satisfies Record<Ability, string>

const descriptions = {
  [Ability.Vampire]: 'Восстанавливает вам половину наносимого этим мечом урона',
  [Ability.ExtraDamage]: '10% шанс сделать двойной урон',
  [Ability.Nothing]: '',
}

export const schema = new ItemLoreSchema('item-ability')
  .property('ability', String)
  .display('Способность', p =>
    isKeyof(p, descriptions) ? `${names[p]}\n\n${descriptions[p]}` : names[Ability.Nothing],
  )
  .build()

export const ItemAbility = {
  Ability,
  descriptions,
  names,
  schema,
}

new Command('itemability')
  .setDescription('Позволяет получать предмет с кастомной чаркой')
  .setPermissions('techAdmin')
  .array('sword type', ['diamond', 'iron', 'netherite'])
  .array('ability', [Ability.Vampire, Ability.ExtraDamage])
  .executes((ctx, type, ability) => {
    const { item } = schema.create({ ability }, `minecraft:${type}_sword`)
    ctx.player.container?.addItem(item)
  })

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource: { damagingEntity, cause } }) => {
  if (!damagingEntity?.isPlayer() || !hurtEntity.isPlayer() || cause !== EntityDamageCause.entityAttack) return

  const mainhand = damagingEntity.mainhand()
  const item = mainhand.isValid && mainhand.getItem()
  const storage = item && schema.parse(item)
  if (!storage) return

  switch (storage.enchant) {
    case Ability.Vampire: {
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
    case Ability.ExtraDamage: {
      if (selectByChance(extraDamage).item) {
        damagingEntity.success('х2 урон!', false)
        hurtEntity.applyDamage(damage, { damagingEntity, cause })
      }
      break
    }
    default: {
      storage.enchant = Ability.Nothing
    }
  }
})

const extraDamage = [
  { chance: 10, item: true },
  { chance: 100, item: false },
]

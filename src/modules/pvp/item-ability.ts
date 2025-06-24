import { EntityDamageCause, world } from '@minecraft/server'
import { isKeyof } from 'lib'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { l, t } from 'lib/i18n/text'
import { rollChance } from 'lib/rpg/random'

export enum Ability {
  Vampire = 'vamp',
  ExtraDamage = 'dmgx',
  Nothing = '0',
}

const names = {
  [Ability.Vampire]: t`Вампиризм`,
  [Ability.ExtraDamage]: t`Дополнительный урон`,
  [Ability.Nothing]: t`Неизвестная`,
} satisfies Record<Ability, string>

const descriptions = {
  [Ability.Vampire]: t`Восстанавливает вам половину наносимого этим мечом урона`,
  [Ability.ExtraDamage]: t`10% шанс сделать двойной урон`,
  [Ability.Nothing]: '',
}

export const schema = new ItemLoreSchema('item-ability')
  .property('ability', String)
  .display(t`Способность`, p =>
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
  .setDescription(l`Позволяет получать предмет с кастомной чаркой`)
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
      if (rollChance(10)) {
        damagingEntity.success(t`х2 урон!`, false)
        hurtEntity.applyDamage(damage, { damagingEntity, cause })
      }
      break
    }
    default: {
      storage.enchant = Ability.Nothing
    }
  }
})

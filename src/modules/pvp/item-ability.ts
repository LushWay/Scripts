import { EntityDamageCause, world } from '@minecraft/server'
import { isKeyof } from 'lib'
import { defaultLang } from 'lib/assets/lang'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { i18n, i18nShared, noI18n } from 'lib/i18n/text'
import { rollChance } from 'lib/rpg/random'

export enum Ability {
  Vampire = 'vamp',
  ExtraDamage = 'dmgx',
  Nothing = '0',
}

const names = {
  [Ability.Vampire]: i18nShared`Вампиризм`,
  [Ability.ExtraDamage]: i18nShared`Дополнительный урон`,
  [Ability.Nothing]: i18nShared`Неизвестная`,
} satisfies Record<Ability, SharedText>

const descriptions = {
  [Ability.Vampire]: i18nShared`Восстанавливает вам половину наносимого этим мечом урона`,
  [Ability.ExtraDamage]: i18nShared`10% шанс сделать двойной урон`,
  [Ability.Nothing]: '',
}

export const schema = new ItemLoreSchema('item-ability')
  .property('ability', String)
  .display(i18n`Способность`, p =>
    isKeyof(p, descriptions)
      ? i18n.join`${names[p]}\n\n${descriptions[p]}`.to(defaultLang)
      : names[Ability.Nothing].to(defaultLang),
  )
  .build()

export const ItemAbility = {
  Ability,
  descriptions,
  names,
  schema,
}

new Command('itemability')
  .setDescription(noI18n`Позволяет получать предмет с кастомной чаркой`)
  .setPermissions('techAdmin')
  .array('sword type', ['diamond', 'iron', 'netherite'])
  .array('ability', [Ability.Vampire, Ability.ExtraDamage])
  .executes((ctx, type, ability) => {
    const { item } = schema.create(ctx.player.lang, { ability }, `minecraft:${type}_sword`)
    ctx.player.container?.addItem(item)
  })

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource: { damagingEntity, cause } }) => {
  if (!damagingEntity?.isPlayer() || !hurtEntity.isPlayer() || cause !== EntityDamageCause.entityAttack) return

  const mainhand = damagingEntity.mainhand()
  const item = mainhand.isValid && mainhand.getItem()
  const storage = item && schema.parse(damagingEntity.lang, item)
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
        damagingEntity.success(i18n`х2 урон!`, false)
        hurtEntity.applyDamage(damage, { damagingEntity, cause })
      }
      break
    }
    default: {
      storage.enchant = Ability.Nothing
    }
  }
})

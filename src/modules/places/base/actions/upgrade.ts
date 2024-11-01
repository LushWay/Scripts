import { Player } from '@minecraft/server'
import { Product } from 'lib/shop/product'
import { MaybeRawText, t } from 'lib/text'
import { baseLevels } from '../base-levels'
import { BaseRegion } from '../region'

export function baseUpgradeButton(base: BaseRegion, player: Player, back: (message?: MaybeRawText) => void) {
  const levelText = `${base.linkedDatabase.level}/${baseLevels.length - 1}`
  const upgradeTo = base.linkedDatabase.level + 1
  if (!(upgradeTo in baseLevels)) return [`§7Максимальный уровень\n${levelText}`, undefined, back] as Product['button']

  const upgradeLevel = baseLevels[upgradeTo]
  return Product.create()
    .form(back)
    .player(player)
    .name(t`Улучшить базу до\n${upgradeTo} уровня, радиус ${upgradeLevel.radius} (${levelText})`)
    .cost(upgradeLevel.cost)
    .onBuy(() => {
      //
    }).button
}

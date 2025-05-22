import { Player } from '@minecraft/server'
import { Product } from 'lib/shop/product'
import { MaybeRawText, t } from 'lib/text'
import { baseLevels } from '../base-levels'
import { BaseRegion } from '../region'

export function baseUpgradeButton(base: BaseRegion, player: Player, back: (message?: MaybeRawText) => void) {
  const upgradeLevel = base.ldb.level + 1
  let levelText = t`${base.ldb.level}/${baseLevels.length - 1}`
  if (!(upgradeLevel in baseLevels))
    return [`§7Максимальный уровень\n${levelText}`, undefined, back] as Product['button']

  const upgrade = baseLevels[upgradeLevel]
  levelText = t`${levelText} (радиус ${base.area.radius} -> ${upgrade.radius})`
  return Product.create()
    .form(back)
    .player(player)
    .name(t`Улучшить базу: ${levelText}`)
    .cost(upgrade.cost)
    .onBuy(() => {
      base.ldb.level = upgradeLevel
      base.updateRadius()
      player.success()
    }).button
}

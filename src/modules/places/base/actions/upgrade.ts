import { Player } from '@minecraft/server'
import { Product } from 'lib/shop/product'
import { MaybeRawText, t } from 'lib/text'
import { baseLevels } from '../base-levels'
import { BaseRegion } from '../region'

export function baseUpgradeButton(base: BaseRegion, player: Player, back: (message?: MaybeRawText) => void) {
  const upgradeLevel = base.ldb.level + 1
  const upgrade = baseLevels[upgradeLevel]
  let levelText = t`${base.ldb.level}/${baseLevels.length - 1}`
  if (!upgrade) return [`§7Максимальный уровень\n${levelText}`, undefined, back] as Product['button']

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

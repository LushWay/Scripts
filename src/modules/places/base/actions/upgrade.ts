import { Player } from '@minecraft/server'
import { i18n } from 'lib/i18n/text'
import { Product } from 'lib/shop/product'
import { baseLevels } from '../base-levels'
import { BaseRegion } from '../region'

export function baseUpgradeButton(base: BaseRegion, player: Player, back: (message?: Text) => void) {
  // TODO Fix colors
  const upgradeLevel = base.ldb.level + 1
  const upgrade = baseLevels[upgradeLevel]
  let levelText = i18n.join`${base.ldb.level}/${baseLevels.length - 1}`
  if (!upgrade) return [i18n.disabled`Максимальный уровень\n${levelText}`, undefined, back] as Product['button']

  levelText = i18n`${levelText} (радиус ${base.area.radius} -> ${upgrade.radius})`
  return Product.create()
    .form(back)
    .player(player)
    .name(i18n`Улучшить базу: ${levelText}`)
    .cost(upgrade.cost)
    .onBuy(() => {
      base.ldb.level = upgradeLevel
      base.updateRadius()
      player.success()
    }).button
}

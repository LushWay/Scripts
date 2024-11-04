import { Player } from '@minecraft/server'
import { SphereArea } from 'lib/region/areas/sphere'
import { Product } from 'lib/shop/product'
import { MaybeRawText, t } from 'lib/text'
import { baseLevels } from '../base-levels'
import { BaseRegion } from '../region'

export function baseUpgradeButton(base: BaseRegion, player: Player, back: (message?: MaybeRawText) => void) {
  const levelText = t`${base.ldb.level}/${baseLevels.length - 1}`
  const upgradeLevel = base.ldb.level + 1
  if (!(upgradeLevel in baseLevels))
    return [`§7Максимальный уровень\n${levelText}`, undefined, back] as Product['button']

  const upgrade = baseLevels[upgradeLevel]
  return Product.create()
    .form(back)
    .player(player)
    .name(t`Улучшить базу: ${levelText}`)
    .cost(upgrade.cost)
    .onBuy(() => {
      base.ldb.level = upgradeLevel
      if (base.area instanceof SphereArea) base.area.radius = upgrade.radius
      player.success()
    }).button
}

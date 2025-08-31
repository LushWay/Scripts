import { ItemStack, system, world } from '@minecraft/server'

import { Vec } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { Items } from 'lib/assets/custom-items'
import { i18n } from 'lib/i18n/text'
import { customItems } from 'lib/rpg/custom-item'
import { explosibleEntities, ExplosibleEntityOptions } from './explosible-entities'
import { decreaseMainhandItemCount } from './throwable-tnt'

export const FireBallItem = new ItemStack(Items.Fireball).setInfo(
  undefined,
  i18n`Используйте, чтобы отправить все в огненный ад`,
)

customItems.push(FireBallItem)

const fireballExplosion: ExplosibleEntityOptions = {
  damage: 3,
  strength: 0.2,
  causesFire: true,
  breaksBlocks: true,
}

world.afterEvents.itemUse.subscribe(event => {
  if (!FireBallItem.is(event.itemStack)) return

  decreaseMainhandItemCount(event.source)

  const entity = event.source.dimension.spawnEntity<CustomEntityTypes>(
    CustomEntityTypes.Fireball,
    event.source.getHeadLocation(),
  )
  const projectile = entity.getComponent('projectile')
  if (!projectile) throw new TypeError('No projectile!')

  projectile.owner = event.source
  projectile.shoot(Vec.multiply(event.source.getViewDirection(), 1.3), { uncertainty: 0.1 })
  explosibleEntities.add({ source: event.source, entity, explosion: fireballExplosion })
})

world.afterEvents.dataDrivenEntityTrigger.subscribe(
  event => {
    if (!event.entity.isValid) return

    const typeId = event.entity.typeId
    const location = event.entity.location
    const dimension = event.entity.dimension

    system.delay(() => {
      if (event.entity.isValid) event.entity.remove()
      if (typeId !== CustomEntityTypes.Fireball) return

      dimension.createExplosion(location, 1.5, { causesFire: true, breaksBlocks: true })
    })
  },
  { eventTypes: ['lw:explode'] },
)

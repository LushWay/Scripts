import { system, world } from '@minecraft/server'
import { MinecraftItemTypes as i, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Cooldown, ms, Vector } from 'lib'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'

export const CannonItem = new CustomItemWithBlueprint('cannon')
  .typeId('lw:cannon_spawn_egg')
  .nameTag('Поставить пушку')
  .lore('Используй этот предмет, чтобы установить пушку')

export const CannonBulletItem = new CustomItemWithBlueprint('cannon bullet')
  .typeId(i.PolishedTuffSlab)
  .nameTag('Снаряд для пушки')
  .lore('Используй этот предмет на пушке, чтобы она выстрелила. Сидя на пушке стрелять нельзя.')

const cooldown = new Cooldown(ms.from('sec', 5))

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
  if (event.target.typeId !== 'lw:cannon') return

  const mainhand = event.player.mainhand()
  if (!CannonBulletItem.isItem(mainhand.getItem())) return
  if (!cooldown.isExpired(event.player)) return

  event.cancel = true
  system.delay(() => {
    if (mainhand.isValid()) {
      if (mainhand.amount === 1) mainhand.setItem(undefined)
      else mainhand.amount--
    }

    if (event.target.isValid()) {
      const view = event.target.getViewDirection()
      const location = Vector.add(Vector.add(event.target.location, Vector.multiply(view, 2.5)), {
        x: 0,
        y: 1.5,
        z: 0,
      })
      const tnt = event.target.dimension.spawnEntity(
        MinecraftEntityTypes.Tnt,
        Vector.add(location, { x: 0, y: -0.5, z: 0 }),
      )
      tnt.applyImpulse(Vector.multiply(view, 3))
      event.target.dimension.playSound('random.explode', location, { volume: 4, pitch: 0.9 })
      event.target.dimension.spawnParticle('minecraft:dragon_dying_explosion', location)
    }
  })
})
world.beforeEvents.playerInteractWithBlock.subscribe(event => {
  if (CannonBulletItem.isItem(event.itemStack)) {
    event.cancel = true
  }
})

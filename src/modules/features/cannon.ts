import { EntityComponentTypes, Player, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { actionGuard, ActionGuardOrder, Cooldown, ms, Vector } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { t } from 'lib/text'

export const CannonItem = new CustomItemWithBlueprint('cannon')
  .typeId('lw:cannon_spawn_egg')
  .lore('Используй этот предмет, чтобы установить пушку')

export const CannonShellItem = new CustomItemWithBlueprint('cannon shell')
  .typeId('lw:cannon_shell')
  .lore('Используй этот предмет на пушке, чтобы она выстрелила. Сидя на пушке стрелять нельзя.')

const cooldown = new Cooldown(ms.from('sec', 5))

actionGuard((player, _, ctx) => {
  if (ctx.type !== 'interactWithEntity' && ctx.type !== 'interactWithBlock') return

  return fire(player)
}, ActionGuardOrder.Feature)

function guide(player: Player) {
  system.delay(() => player.fail(t.error`Используй этот предмет сидя на пушке`))
  return false
}

world.beforeEvents.itemUse.subscribe(event => {
  event.cancel = !fire(event.source, true)
})

function fire(player: Player, fire = false) {
  if (!CannonShellItem.isItem(player.mainhand().getItem())) return

  const riding = player.getComponent(EntityComponentTypes.Riding)
  const cannon = riding?.entityRidingOn
  if (!cannon || cannon.typeId !== CustomEntityTypes.Cannon) return guide(player)
  if (!cooldown.isExpired(player)) return false

  if (fire)
    system.delay(() => {
      const mainhand = player.mainhand()
      if (mainhand.isValid) {
        if (mainhand.amount === 1) mainhand.setItem(undefined)
        else mainhand.amount--
      }

      if (cannon.isValid) {
        const view = cannon.getViewDirection()
        const location = Vector.add(Vector.add(cannon.location, Vector.multiply(view, 2.5)), { x: 0, y: 1.5, z: 0 })
        const tnt = cannon.dimension.spawnEntity(
          MinecraftEntityTypes.Tnt,
          Vector.add(location, { x: 0, y: -0.5, z: 0 }),
        )
        tnt.applyImpulse(Vector.multiply(player.getViewDirection(), 2))
        cannon.dimension.playSound('random.explode', location, { volume: 4, pitch: 0.9 })
        cannon.dimension.spawnParticle('minecraft:dragon_dying_explosion', location)
      }
    })

  return false
}

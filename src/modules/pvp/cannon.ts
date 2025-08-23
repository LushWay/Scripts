import { EntityComponentTypes, Player, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { actionGuard, ActionGuardOrder, Cooldown, ms, Vec } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { i18n } from 'lib/i18n/text'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { explosibleEntities, ExplosibleEntityOptions } from './explosible-entities'
import { decreaseMainhandItemCount } from './throwable-tnt'

export const CannonItem = new CustomItemWithBlueprint('cannon')
  .typeId('lw:cannon_spawn_egg')
  .lore(i18n`Используй этот предмет, чтобы установить пушку`)

export const CannonShellItem = new CustomItemWithBlueprint('cannon shell')
  .typeId('lw:cannon_shell')
  .lore(i18n`Используй этот предмет на пушке, чтобы она выстрелила. Сидя на пушке стрелять нельзя.`)

const cooldown = new Cooldown(ms.from('sec', 5))
const tellCooldown = new Cooldown(ms.from('sec', 1), false)

actionGuard((player, _, ctx) => {
  if (ctx.type !== 'interactWithEntity' && ctx.type !== 'interactWithBlock') return

  return fire(player)
}, ActionGuardOrder.Feature)

function guide(player: Player) {
  if (tellCooldown.isExpired(player)) system.delay(() => player.fail(i18n.error`Используй этот предмет сидя на пушке`))
  return false
}

world.afterEvents.itemUse.subscribe(event => {
  fire(event.source, true)
})

const cannonShellExplosion: ExplosibleEntityOptions = {
  damage: 0,
  strength: 5,
  breaksBlocks: true,
  causesFire: false,
  customBlocksToBreak: [MinecraftBlockTypes.Obsidian, MinecraftBlockTypes.CryingObsidian],
  r: true,
}

function fire(player: Player, fire = false) {
  if (!CannonShellItem.isItem(player.mainhand().getItem())) return

  const riding = player.getComponent(EntityComponentTypes.Riding)
  const cannon = riding?.entityRidingOn
  if (!cannon || cannon.typeId !== CustomEntityTypes.Cannon) return guide(player)
  if (!cooldown.isExpired(player)) return false

  if (fire)
    system.delay(() => {
      decreaseMainhandItemCount(player)

      if (cannon.isValid) {
        const view = cannon.getViewDirection()
        const location = Vec.add(Vec.add(cannon.location, Vec.multiply(view, 2.5)), { x: 0, y: 1.5, z: 0 })
        const tnt = cannon.dimension.spawnEntity(MinecraftEntityTypes.Tnt, Vec.add(location, { x: 0, y: -0.5, z: 0 }))
        tnt.applyImpulse(Vec.multiply(player.getViewDirection(), 2))
        explosibleEntities.add({ source: player, entity: tnt, explosion: cannonShellExplosion })
        cannon.dimension.playSound('random.explode', location, { volume: 4, pitch: 0.9 })
        cannon.dimension.spawnParticle('minecraft:dragon_dying_explosion', location)
      }
    })

  return false
}

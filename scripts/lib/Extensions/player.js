import { Container, Entity, EntityDamageCause, EquipmentSlot, GameMode, Player, world } from '@minecraft/server'
import { OverTakes } from './OverTakes.js'

Player.prototype.tell = Player.prototype.sendMessage
OverTakes(Player, {
  fetch(name) {
    for (const p of world.getPlayers()) {
      if (p.name === name || p.id === name) return p
    }
  },
  name(id) {
    throw new ReferenceError('SM is not fully loaded!')
  },
})

OverTakes(Player.prototype, {
  tell: Player.prototype.sendMessage,
  applyDash(target, horizontalStrength, verticalStrength) {
    const view = target.getViewDirection()
    const hStrength = Math.sqrt(view.x ** 2 + view.z ** 2) * horizontalStrength
    const vStrength = view.y * verticalStrength
    target.applyKnockback(view.x, view.z, hStrength, vStrength)
  },
  isGamemode(mode) {
    return this.matches({
      gameMode: GameMode[mode],
    })
  },
  closeChat(message) {
    const fail = () => (message && this.tell(message), false)
    const health = this.getComponent('health')
    if (!health) return fail()

    const current = health.currentValue
    if (current <= 1) fail()

    // We need to switch player to gamemode where we can apply damage to them
    const isCreative = this.isGamemode('creative')
    if (isCreative) this.runCommand('gamemode s')

    this.applyDamage(1, {
      cause: EntityDamageCause.entityAttack,
    })
    health.setCurrentValue(current)
    this.runCommand('stopsound @s game.player.hurt')

    // Return player back to creative mode
    if (isCreative) this.runCommand('gamemode c')

    return true
  },
  mainhand() {
    const equippable = this.getComponent('equippable')
    if (!equippable) throw new TypeError(`Player '${this.name}' doesn't have equippable component (probably died).`)
    return equippable.getEquipmentSlot(EquipmentSlot.Mainhand)
  },
})

OverTakes(Entity.prototype, {
  get container() {
    if (!this || !this.getComponent) throw new TypeError('Bound prototype object does not exists')
    return this.getComponent('inventory').container
  },
})

OverTakes(Container.prototype, {
  entries() {
    /** @type {ReturnType<Container['entries']>} */
    const items = []
    for (let i = 0; i < this.size; i++) {
      items.push([i, this.getItem(i)])
    }
    return items
  },
})

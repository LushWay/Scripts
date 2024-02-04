import { Container, Entity, EntityDamageCause, EquipmentSlot, GameMode, Player, system, world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { OverTakes } from './OverTakes.js'

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

/**
 * @param {string} pref
 * @param {string} sound
 * @returns {(this: Player, message: string) => void}
 */
function prefix(pref, sound) {
  return function (message) {
    system.delay(() => {
      this.playSound(sound)
      this.tell(pref + message)
    })
  }
}

/** @type {Set<string>} */
export const CLOSING_CHAT = new Set()

export const SCREEN_DISPLAY = Symbol('screen_display')

OverTakes(Player.prototype, {
  // @ts-expect-error Проброс
  get [SCREEN_DISPLAY]() {
    return super.onScreenDisplay
  },

  get onScreenDisplay() {
    return Object.setPrototypeOf(
      {
        player: this,
      },
      super.onScreenDisplay
    )
  },

  fail: prefix('§4§l> §r§c', SOUNDS.fail),
  warn: prefix('§l§e⚠ §6', SOUNDS.fail),
  success: prefix('§a§l> §r', SOUNDS.success),
  info: prefix('§b§l> §r§3', SOUNDS.action),

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

    CLOSING_CHAT.add(this.id)
    this.applyDamage(1, {
      cause: EntityDamageCause.entityAttack,
    })
    CLOSING_CHAT.delete(this.id)
    health.setCurrentValue(current)
    this.runCommand('stopsound @a[r=5] game.player.hurt')

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

import { Container, Entity, EntityDamageCause, EquipmentSlot, GameMode, Player, system, world } from '@minecraft/server'
import { SOUNDS } from 'lib/assets/config'
import { request } from 'lib/bds/api'
import { ScreenDisplayOverride } from 'lib/extensions/on-screen-display'
import { expand } from './extend'

declare module '@minecraft/server' {
  interface Player {
    /** Whenether player is simulated or not */
    isSimulated(): this is import('@minecraft/server-gametest').SimulatedPlayer

    /**
     * Sends message prefixed with
     *
     * ```js
     * '§4§l> §r§c'
     * ```
     *
     * And plays {@link SOUNDS}.fail
     *
     * Other message types: warn success info
     */
    fail(message: string): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§l§e⚠ §6'
     * ```
     *
     * And plays {@link SOUNDS}.fail
     *
     * Other message types: **fail success info**
     */
    warn(message: string): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§a§l> §r'
     * ```
     *
     * And plays {@link SOUNDS}.success
     *
     * Other message types: **fail warn info**
     */
    success(message: string): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§b§l> §r§3'
     * ```
     *
     * And plays {@link SOUNDS}.action
     *
     * Other message types: **fail warn success**
     */
    info(message: string): void

    /** Gets ContainerSlot from the player mainhand */
    mainhand(): ContainerSlot

    /** See {@link Player.sendMessage} */
    tell(message: (RawMessage | string)[] | RawMessage | string): void

    /**
     * Applies a knock-back to a player in the direction they are facing, like dashing forward
     *
     * @author @wuw.sh
     */
    applyDash(target: Player | Entity, horizontalStrength: number, verticalStrength: number): void

    /** Determines player gamemode */
    isGamemode(mode: keyof typeof GameMode): boolean

    /**
     * Turns player into survival, damages (if hp < 1 shows lowHealthMessage), and then returns to previous gamemode
     *
     * @returns True if damaged, false if not and lowHealthMessage was shown
     */
    closeChat(lowHealthMessage?: string): boolean
  }
}

expand(Player, {
  getById(name) {
    for (const player of world.getPlayers()) {
      if (player.id === name) return player
    }
  },

  getByName(name) {
    for (const player of world.getPlayers()) {
      if (player.isValid() && player.name === name) return player
    }
  },

  name(id) {
    throw new Error('Cannot use Player.name before player database initialization!')
  },
})

function prefix(pref: string, sound: string): (this: Player, message: string) => void {
  return function (this, message) {
    system.delay(() => {
      this.playSound(sound)
      this.tell(pref + message)
    })
  }
}

export const ClosingChatSet = new Set<string>()
export const ScreenDisplaySymbol = Symbol('screen_display')

expand(Player.prototype, {
  isSimulated() {
    return 'jump' in this
  },

  // @ts-expect-error AAAAAAAAAAAAAAA
  get [ScreenDisplaySymbol]() {
    return super.onScreenDisplay
  },

  get onScreenDisplay() {
    return {
      player: this,
      ...ScreenDisplayOverride,
    }
  },

  fail: prefix('§4§l> §r§c', SOUNDS.fail),
  warn: prefix('§e⚠ §6', SOUNDS.fail),
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

    ClosingChatSet.add(this.id)
    this.applyDamage(1, {
      cause: EntityDamageCause.entityAttack,
    })
    ClosingChatSet.delete(this.id)
    health.setCurrentValue(current)
    this.runCommand('stopsound @a[r=5] game.player.hurt')

    // Return player back to creative mode
    if (isCreative) this.runCommand('gamemode c')

    return true
  },
  mainhand() {
    const equippable = this.getComponent('equippable')
    if (!equippable) {
      request('reload', { status: 100 })
      throw new ReferenceError(`Player '${this.name}' doesn't have equippable component (probably died).`)
    }
    return equippable.getEquipmentSlot(EquipmentSlot.Mainhand)
  },
})

declare module '@minecraft/server' {
  interface Entity {
    readonly container?: Container
  }

  interface Container {
    entries(): [number, ItemStack | undefined][]
    slotEntries(): [number, ContainerSlot][]
  }
}

expand(Entity.prototype, {
  get container() {
    if (!this || !this.getComponent) throw new ReferenceError('Bound prototype object does not exists')
    if (!super.isValid()) throw new ReferenceError('Entity is invalid')
    return this.getComponent('inventory')?.container
  },
})

expand(Container.prototype, {
  entries() {
    const items: ReturnType<Container['entries']> = []
    for (let i = 0; i < this.size; i++) {
      items.push([i, this.getItem(i)])
    }
    return items
  },

  slotEntries() {
    const items: ReturnType<Container['slotEntries']> = []
    for (let i = 0; i < this.size; i++) {
      items.push([i, this.getSlot(i)])
    }
    return items
  },
})

import { Container, Entity, EntityDamageCause, EquipmentSlot, GameMode, Player, system, world } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { Language } from 'lib/assets/lang'
import { sendPacketToStdout } from 'lib/bds/api'
import { ScreenDisplayOverride } from 'lib/extensions/on-screen-display'
import { i18n } from 'lib/i18n/text'
import { Vec } from 'lib/vector'
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
     * And plays {@link Sounds}.fail
     *
     * Other message types: warn success info
     */
    fail(message: Text, sound?: boolean): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§l§e⚠ §6'
     * ```
     *
     * And plays {@link Sounds}.fail
     *
     * Other message types: **fail success info**
     */
    warn(message: Text, sound?: boolean): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§a§l> §r'
     * ```
     *
     * And plays {@link Sounds}.success
     *
     * Other message types: **fail warn info**
     */
    success(message?: Text, sound?: boolean): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§b§l> §r§3'
     * ```
     *
     * And plays {@link Sounds}.action
     *
     * Other message types: **fail warn success**
     */
    info(message: Text, sound?: boolean): void

    /** Gets ContainerSlot from the player mainhand */
    mainhand(): ContainerSlot

    /** See {@link Player.sendMessage} */
    tell(message: Text | string): void

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

    lang: Language
  }

  namespace Player {
    /**
     * Searches online player by ID
     *
     * @param id - Player ID
     */
    function getById(id: string): Player | undefined
    /**
     * Searches online player by name
     *
     * **CAUTION**: You should ALWAYS prefer using {@link Player.getById} because of security purposes. Minecraft is
     * weird with how it handles names, e.g. they can be changed, spoofed etc. So you totally should NOT depend on
     * player name or search player by it, unless the player is searching other player.
     *
     * @param name - Player name to search for
     */
    function getByName(name: string): Player | undefined
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
      if (player.isValid && player.name === name) return player
    }
  },

  name(id) {
    throw new Error('Cannot use Player.name before player database initialization!')
  },
})

function prefix(pref: string, sound: string): (this: Player, message: Text, playSound?: boolean) => void
function prefix(
  pref: string,
  sound: string,
  defaultText: Text,
): (this: Player, message?: Text, playSound?: boolean) => void
function prefix(
  pref: string,
  sound: string,
  defaultText?: Text,
): (this: Player, message?: Text, playSound?: boolean) => void {
  return function (this, message = defaultText, playSound = true) {
    system.delay(() => {
      if (!this.isValid || !message) return
      if (playSound) this.playSound(sound)
      this.tell(pref + message.to(this.lang))
    })
  }
}

export const ClosingChatSet = new Set<string>()
export const ScreenDisplaySymbol = Symbol('screen_display')

expand(Player.prototype, {
  get lang() {
    return __VITEST__ ? Language.ru_RU : Language.ru_RU
  },

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

  fail: prefix('§4§l> §r§c', Sounds.Fail),
  warn: prefix('§e⚠ §6', Sounds.Fail),
  success: prefix('§a§l> §r', Sounds.Success, i18n`Успешно`),
  info: prefix('§b§l> §r§3', Sounds.Success),

  tell(msg) {
    return this.sendMessage(msg.to(this.lang))
  },

  applyDash(target, horizontalStrength, verticalStrength) {
    const view = target.getViewDirection()
    const hStrength = Math.sqrt(view.x ** 2 + view.z ** 2) * horizontalStrength
    const vStrength = view.y * verticalStrength
    target.applyKnockback(Vec.multiply(view, hStrength), vStrength)
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
    const been = this.getGameMode()
    const damageable = been === GameMode.Survival || been === GameMode.Adventure
    if (!damageable) this.setGameMode(GameMode.Survival)

    const equippable = this.getComponent('equippable')
    const damages =
      equippable &&
      [EquipmentSlot.Chest, EquipmentSlot.Feet, EquipmentSlot.Head, EquipmentSlot.Legs].map(rslot => {
        const slot = equippable.getEquipmentSlot(rslot)
        return { slot, item: slot.getItem() }
      })

    ClosingChatSet.add(this.id)
    this.applyDamage(1, { cause: EntityDamageCause.entityAttack })
    ClosingChatSet.delete(this.id)

    damages?.forEach(({ slot, item }) => slot.setItem(item))
    health.setCurrentValue(current)
    this.runCommand('stopsound @a[r=5] game.player.hurt')

    // Return player back to creative mode
    if (!damageable) this.setGameMode(been)

    return true
  },
  mainhand() {
    const equippable = this.getComponent('equippable')
    if (!equippable) {
      const reason = `Player '${this.name}' doesn't have equippable component (probably died).`
      sendPacketToStdout('reload', { reason })
      throw new ReferenceError(reason)
    }
    return equippable.getEquipmentSlot(EquipmentSlot.Mainhand)
  },
})

declare module '@minecraft/server' {
  interface Entity {
    readonly container?: Container

    isPlayer(): this is Player
  }

  interface Container {
    entries(): [number, ItemStack | undefined][]
    slotEntries(): [number, ContainerSlot][]
  }
}

expand(Entity.prototype, {
  get container() {
    if (typeof this === 'undefined' || !this.getComponent)
      throw new ReferenceError('Bound prototype object does not exists')
    if (!super.isValid) throw new ReferenceError('Entity is invalid')
    return this.getComponent('inventory')?.container
  },
  isPlayer() {
    return this instanceof Player
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

/* eslint-disable */
// @ts-nocheck

import {
  Player,
  Vector,
  WorldAfterEvents,
  system,
  world,
} from '@minecraft/server'
import { EventSignal, XA } from 'xapi.js'
import { PVP } from '../../Indicator/var.js'
import { teleportToBR } from './index.js'
import { rtp } from './rtp.js'
import { BATTLE_ROYAL_EVENTS, BR_CONFIG, BR_DB } from './var.js'
import { Zone } from './zone.js'

class BattleRoyal {
  /** @type {{[Key in keyof WorldAfterEvents]?: Parameters<WorldAfterEvents[Key]["subscribe"]>[0]}} */
  events
  constructor() {
    this.dimension = world.overworld
    /**
     * @type {Array<Player>}
     */
    this.players = []
    this.reward = 0
    this.pos = { x: 256, z: 256 }
    this.time = {
      min: 0,
      sec: 0,
      tick: 20,
    }
    this.game = {
      started: false,
      rad: 0,
      startrad: 0,
      minrad: 0,
    }
    this.center = {
      x: 0,
      z: 0,
    }
    this.quene = {
      open: false,
      time: 0,
    }
    this.tags = ['br:alive', 'br:inGame']
  }
  /**
   * Waiting for the player to respawn.
   * @param {string} name Name of the player
   */
  async waitToRespawn(name) {
    let C = 0

    while (world.overworld.runCommand('testfor ' + name) < 1 && C < 100) {
      await system.sleep(5)
      C++
    }

    EventSignal.emit(BATTLE_ROYAL_EVENTS.join, Player.fetch(name))
  }

  /**
   *
   * @param {string[]} players
   * @returns
   */
  start(players) {
    try {
      // Ресет
      this.quene.open = false
      this.quene.time = 0

      // Значения из настроек
      ;[this.time.min, this.time.sec] = BR_CONFIG.time.split(':').map(Number)
      ;[this.pos.x, this.pos.z] = BR_CONFIG.gamepos.split(':').map(Number)
      this.game.started = true
      this.reward = 0

      const allplayers = world.getAllPlayers().map(e => e.id)
      players = players.filter(e => allplayers.includes(e))

      if (players.length < 1)
        return this.end('error', '§cЗапуск без игроков невозможен')

      this.reward = this.reward + players.length * 100
      this.game.rad = Math.min(60 * players.length, 128)
      this.game.minrad = Math.min(15 * players.length, 40)
      this.game.startrad = this.game.rad

      // Центр
      this.center.z = Math.randomInt(
        this.pos.z + 128 + 50,
        this.pos.z + 128 - 50
      )
      this.center.x = Math.randomInt(
        this.pos.x + 128 + 50,
        this.pos.x + 128 - 50
      )

      /**
       * Сундуки (для удаления в будущем)
       * @type {Array<string>}
       */
      const chests = []
      /**
       * Позиции спавна игроков
       * @type {Vector3[]}
       */
      const poses = []

      const debug = false
      if (debug) {
        world.say(
          `Pos1: ${this.pos.x} ${this.pos.z}\nCenter: ${this.center.x} ${
            this.center.z
          }\nPos2: ${this.pos.x + 256} ${this.pos.z + 256}`
        )
      }

      // Для каждого игрока
      for (const e of players) {
        // Тэги
        const p = Player.fetch(e)
        this.tags.forEach(e => p.addTag(e))
        PVP.disabled.push(p.id)

        // Список
        this.players.push(p)

        // Инфо
        p.tell(
          XA.Lang.lang['br.start'](
            this.reward,
            allplayers.join('§r, '),
            this.game.rad
          )
        )

        // Очистка, звук
        p.runCommandAsync('clear @s')
        p.playSound('note.pling')

        // Ртп
        const pos = rtp(
          p,
          this.center.x,
          this.center.z,
          this.game.rad - 15,
          this.game.rad - 30,
          poses
        )
        poses.push(pos)
        this.dimension
          .getEntities({
            location: pos,
            maxDistance: 100,
            type: 'minecraft:item',
          })
          .forEach(item => item.kill())

        //Стартовый сундук
        // const ps = new LootChest(pos.x, pos.z, 0, 10).pos;
        // if (ps) chest.push(ps);
      }

      BR_DB.set('br:' + Date.now(), chests)
      this.timers = [
        system.runInterval(
          () => {
            //Таймер
            this.time.tick--
            if (this.time.tick <= 0) {
              this.time.sec--, (this.time.tick = 20)
              // for (const val of BR_DB.values()) {
              // 	let p = [];
              // 	try {
              // 		p = JSON.parse(val);
              // 	} catch (e) {}
              // 	for (const pos of p) {
              // 		world.overworld.runCommand(
              // 			`particle minecraft:campfire_smoke_particle ${pos}`
              // 		);
              // 	}
              // }
            }
            if (this.time.sec <= 0) this.time.min--, (this.time.sec = 59)

            //Зона
            for (const p of world.getPlayers()) {
              const rmax = {
                  x: this.center.x + this.game.rad,
                  y: 0,
                  z: this.center.z + this.game.rad,
                },
                rmin = {
                  x: this.center.x - this.game.rad,
                  y: 0,
                  z: this.center.z - this.game.rad,
                }

              const l = Vector.floor(p.location)
              if (
                l.x >= rmax.x &&
                l.x <= rmax.x + 10 &&
                l.z <= rmax.z &&
                l.z >= rmin.z
              )
                Zone.tp(p, true, rmax)
              if (
                l.x >= rmax.x - 10 &&
                l.x <= rmax.x &&
                l.z <= rmax.z &&
                l.z >= rmin.z
              )
                Zone.warn(p, true, rmax)

              if (
                l.z >= rmax.z &&
                l.z <= rmax.z + 10 &&
                l.x <= rmax.x &&
                l.x >= rmin.x
              )
                Zone.tp(p, false, rmax)
              if (
                l.z >= rmax.z - 10 &&
                l.z <= rmax.z &&
                l.x <= rmax.x &&
                l.x >= rmin.x
              )
                Zone.warn(p, false, rmax)

              if (
                l.x <= rmin.x &&
                l.x >= rmin.x - 10 &&
                l.z <= rmax.z &&
                l.z >= rmin.z
              )
                Zone.tp(p, true, rmin, true)
              if (
                l.x <= rmin.x + 10 &&
                l.x >= rmin.x &&
                l.z <= rmax.z &&
                l.z >= rmin.z
              )
                Zone.warn(p, true, rmin)

              if (
                l.z <= rmin.z &&
                l.z >= rmin.z - 10 &&
                l.x <= rmax.x &&
                l.x >= rmin.x
              )
                Zone.tp(p, false, rmin, true)
              if (
                l.z <= rmin.z + 10 &&
                l.z >= rmin.z &&
                l.x <= rmax.x &&
                l.x >= rmin.x
              )
                Zone.warn(p, false, rmin)
            }

            //Отображение таймера и игроков
            for (const player of world.getPlayers({ tags: ['br:inGame'] })) {
              player.onScreenDisplay.setActionBar(
                `§6${
                  this.players.filter(e => e.hasTag('br:alive')).length
                } §g○ §6${this.time.min}:${
                  `${this.time.sec}`.length < 2
                    ? `0${this.time.sec}`
                    : this.time.sec
                } §g○ §6${this.game.rad}`
              )
            }

            //Конец игры
            if (this.time.min <= -1) this.end('time')
            if (this.players.filter(e => e.hasTag('br:alive')).length <= 1)
              this.end(
                'last',
                this.players.find(e => e && e.hasTag('br:alive'))
              )
          },
          'BR game',
          0
        ),
      ]
      this.events = {
        playerLeave: world.afterEvents.playerLeave.subscribe(pl => {
          this.players.forEach((e, i) => {
            if (e.name === pl.playerName) {
              delete this.players[i]
            }
          })
        }),
        entityDie: world.afterEvents.entityDie.subscribe(data => {
          if (!data.deadEntity.hasTag('br:alive')) return

          this.tags.forEach(e => data.deadEntity.removeTag(e))
          this.waitToRespawn(data.deadEntity.nameTag)
        }),
        buttonPush: world.afterEvents.buttonPush.subscribe(data => {
          if (
            !data.source.hasTag('br:alive') ||
            !(data.source instanceof Player)
          )
            return

          const block = data.dimension.getBlock(
            Vector.add(data.block.location, Vector.down)
          )
          if (block.typeId !== 'minecraft:barrel') return

          /** @type {string[]} */
          const barrels = BR_DB.get('chests') ?? []
          const id = `${block.location.x} ${block.location.y} ${block.location.z}`

          if (barrels.includes(id)) return
          barrels.push(id)
          BR_DB.set('chests', barrels)

          // Loot
          data.source.onScreenDisplay.setTitle('§r')
          data.source.onScreenDisplay.updateSubtitle('Открыто')
        }),
      }
    } catch (e) {
      this.end('error', e)
    }
  }

  /**
   *
   * @param {string} reason
   * @param {*} ex
   */
  end(reason, ex) {
    this.game.started = false
    //Причины и соответствующие выводы
    if (reason === 'time') {
      this.players.forEach(e => {
        e.tell(
          XA.Lang.lang['br.end.time'](
            this.players
              .filter(e => e.hasTag('br:alive'))
              .map(e => e.name)
              .join('§r, ')
          )
        )
      })
    }
    if (reason === 'error') {
      world.say(`§cБатл рояль> §c\n${ex} ${ex.stack ? '' : `\n§f${ex.stack}`}`)
    }
    if (reason === 'specially') {
      world.say(XA.Lang.lang['br.end.spec'](ex))
    }
    if (reason === 'last') {
      /**
       * @type {Player}
       */
      const winner = ex
      if (typeof winner == 'object' && Player.fetch(winner.name)) {
        winner.tell(XA.Lang.lang['br.end.winner'](this.reward))
        world.overworld.runCommand(`title "${winner.name}" title §6Ты победил!`)
        world.overworld.runCommand(
          `title "${winner.name}" subtitle §gНаграда: §f${this.reward} §gмонет`
        )
        this.players
          .filter(e => e.name != winner.name)
          .forEach(e => {
            e.tell(XA.Lang.lang['br.end.looser'](winner.name, this.reward))
          })
      } else {
        this.players.forEach(e => {
          e.tell(XA.Lang.lang['br.end.draw']())
        })
      }
    }

    //Общие функции конца

    for (const e of world.getPlayers()) {
      // Eсли у игрока был хоть один тэг из батл рояля - он играл.
      let ingame = false
      this.tags.forEach(t => {
        if (e.removeTag(t)) ingame = true
      })
      // Если играл нужно его вернуть на спавн батл рояля
      if (ingame) teleportToBR(e)
    }
    for (const key in this.events) {
      // @ts-expect-error Strange TS moment
      world.afterEvents[key].unsubscribe(this.events[key])
    }
    this.timers.forEach(system.clearRun)

    //Альтернативная чепуха
    BR_DB.clear()

    const rmax = {
      x: this.center.x + this.game.startrad,
      y: 0,
      z: this.center.z + this.game.startrad,
    }
    const rmin = {
      x: this.center.x - this.game.startrad,
      y: 0,
      z: this.center.z - this.game.startrad,
    }

    for (const p of world.overworld.getEntities({
      type: 'minecraft:item',
    })) {
      const l = Vector.floor(p.location)
      if (l.z <= rmin.z && l.x <= rmin.x && l.x <= rmax.x && l.x >= rmin.x)
        p.kill()
    }

    Object.assign(this, new BattleRoyal())
  }
}

export const br = new BattleRoyal()

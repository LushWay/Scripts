/* eslint-disable */
// @ts-nocheck
// TODO Update

import { Player, system, world } from '@minecraft/server'
import { Command } from 'lib'
import { br } from './game'
import { BATTLE_ROYAL_EVENTS, BR_QUENE } from './var'

const minpl = 2,
  fulltime = 5,
  shorttime = 3

/**
 * It plays a sound and sends a message to every player in the quene.
 *
 * @param {string} sound - The sound to play.
 * @param {string} text - The text that will be displayed to the player.
 */
function forEveryQuenedPlayer(sound: string, text: string) {
  for (const name in BR_QUENE) {
    const player = Player.getById(name)
    if (!player) {
      delete BR_QUENE[name]
      continue
    }
    player.tell(text)
    player.playSound(sound)
  }
}

export function teleportToBR(player: Player) {}

const ks = Object.keys
BATTLE_ROYAL_EVENTS.join.subscribe(player => {
  /** @type {Player} */
  const pl: Player = player
  if (br.players.map(e => e.name).includes(pl.name)) return
  if (br.game.started) return pl.onScreenDisplay.setActionBar(`§cИгра уже идет!`)
  if (BR_QUENE[pl.name])
    return pl.onScreenDisplay.setActionBar(`§6${ks(BR_QUENE).length}/${minpl} §g○ §6${br.quene.time}`)
  BR_QUENE[pl.name] = true
  pl.tell(`§aВы успешно встали в очередь. §f(${ks(BR_QUENE).length}/${minpl}). §aДля выхода пропишите §f-br quit`)
  pl.playSound('random.orb')
})

BATTLE_ROYAL_EVENTS.death.subscribe(player => {
  player.tell('§6Ты погиб!')
  teleportToBR(player)
})

system.runInterval(
  () => {
    if (!br.game.started && world.getPlayers().find(e => e.getTags().find(e => e.startsWith('br:')))) {
      br.end('specially', 'Перезагрузка')
    }

    if (ks(BR_QUENE).length >= minpl && ks(BR_QUENE).length < 10) {
      if (!br.quene.open) {
        br.quene.open = true
        br.quene.time = fulltime
        forEveryQuenedPlayer(
          'random.levelup',
          `§7${ks(BR_QUENE).length}/${minpl} §9Игроков в очереди! Игра начнется через §7${fulltime}§9 секунд.`,
        )
      }
      if (ks(BR_QUENE).length >= 10) {
        br.quene.open = true
        br.quene.time = 16
        forEveryQuenedPlayer('random.levelup', `§6Сервер заполнен! §7(${ks(BR_QUENE).length}/${minpl}).`)
      }
      if (br.quene.open && br.quene.time > 0) {
        br.quene.time--
      }
      if (br.quene.time >= 1 && br.quene.time <= shorttime) {
        let sec = 'секунд'
        const hrs = `${br.quene.time}`
        if (hrs.endsWith('1') && hrs != '11') {
          sec = 'секунду'
        } else if (hrs == '2' || hrs == '3' || hrs == '4') {
          sec = `секунды`
        }
        forEveryQuenedPlayer('random.click', `§9Игра начнется через §7${br.quene.time} ${sec}`)
      }
      if (br.quene.open && br.quene.time == 0) {
        br.start(ks(BR_QUENE))
        Object.assign({}, BR_QUENE)
      }
    }
    ks(BR_QUENE).forEach(e => {
      if (!Player.getById(e)) delete BR_QUENE[e]
    })
    if (br.quene.open && ks(BR_QUENE).length < minpl) {
      br.quene.open = false
      br.quene.time = 0
      forEveryQuenedPlayer('note.bass', `§7${ks(BR_QUENE).length}/${minpl} §9Игроков в очереди. §cИгра отменена...`)
    }
  },
  'battleRoyal',
  20,
)

const bbr = new Command('br').setDescription('Телепортирует на спавн батл рояля').executes(ctx => {
  teleportToBR(ctx.player)
})

bbr
  .overload('quit')
  .setDescription('Выйти из очереди')
  .executes(ctx => {
    if (BR_QUENE[ctx.player.name]) {
      delete BR_QUENE[ctx.player.name]
      ctx.reply('§aВы вышли из очереди.')
    } else {
      ctx.reply('§cВы не стоите в очереди.')
    }
  })

bbr
  .overload('quitgame')
  .setDescription('Выйти из игры')
  .executes(ctx => {
    if (ctx.player.hasTag('locktp:Battle Royal')) {
      delete br.players[br.players.findIndex(e => e.name == ctx.player.name)]
      br.tags.forEach(e => ctx.player.removeTag(e))
      ctx.reply('§aВы вышли из игры.')
      teleportToBR(ctx.player)
    } else {
      ctx.reply('§cВы не находитесь в игре.')
    }
  })

bbr
  .overload('start')
  .setDescription('')
  .setPermissions('techAdmin')
  .executes(() => {
    br.start(ks(BR_QUENE))
    Object.assign({}, BR_QUENE)
  })

bbr
  .overload('stop')
  .setDescription('')
  .setPermissions('techAdmin')
  .executes(() => {
    br.end('specially', 'Так надо')
    Object.assign({}, BR_QUENE)
  })

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  if (player.getTags().find(e => e.startsWith('br:'))) {
    br.tags.forEach(e => player.removeTag(e))
    teleportToBR(player)
  }
})

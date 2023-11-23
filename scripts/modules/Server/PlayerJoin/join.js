import { Player, system, world } from '@minecraft/server'
import { EventSignal, Settings } from 'smapi.js'
import './subscribes.js'
import { JOIN } from './var.js'

/**
 * @param {Player} player
 */
function playerAt(player) {
  const rotation = player.getRotation()
  return [
    player.location.x,
    player.location.y,
    player.location.z,
    rotation.x,
    rotation.y,
  ].map(Math.floor)
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) player.scores.joinDate = ~~(Date.now() / 1000)
  player.database.join ??= {}
  player.database.join.position = playerAt(player)
})

system.runPlayerInterval(
  player => {
    player.database.join ??= {}
    const db = player.database.join

    if (Array.isArray(db.position)) {
      const notMoved = Array.equals(db.position, playerAt(player))

      if (notMoved) {
        // Player still stays at joined position...
        if (player.isOnGround || player.isFlying) {
          // Player will not move, show animation
          db.stage = db.stage ?? -1
          db.stage++
          if (
            isNaN(db.stage) ||
            db.stage >= JOIN.CONFIG.title_animation.stages.length
          )
            db.stage = 0

          // Creating title
          let title = JOIN.CONFIG.title_animation.stages[db.stage]
          for (const [key, value] of Object.entries(
            JOIN.CONFIG.title_animation.vars
          )) {
            title = title.replace('$' + key, value)
          }

          // Show actionBar
          if (JOIN.CONFIG.actionBar) {
            player.onScreenDisplay.setActionBar(JOIN.CONFIG.actionBar)
          }

          player.onScreenDisplay.setTitle(title, {
            fadeInDuration: 0,
            fadeOutDuration: 20,
            stayDuration: 40,
            subtitle: JOIN.CONFIG.subtitle,
          })
        } else {
          // Player joined in air
          join(player, 'air')
        }
      } else {
        // Player moved on ground
        join(player, 'ground')
      }
    }
  },
  'joinInterval',
  20
)

const getSettings = Settings.player('Вход', 'join', {
  message: {
    desc: 'Сообщения о входе других игроков',
    value: true,
    name: 'Сообщение',
  },
  sound: { desc: 'Звук входа других игроков', value: true, name: 'Звук' },
})

/**
 *
 * @param {Player} player
 * @param {"air" | "ground"} messageType
 */
function join(player, messageType) {
  player.database.join ??= {}
  const db = player.database.join
  delete db.position
  delete db.stage

  player.scores.joinTimes ??= 0
  player.scores.joinTimes++

  for (const other of world.getPlayers()) {
    if (other.id === player.id) continue
    const settings = getSettings(other)
    if (settings.sound) other.playSound(JOIN.CONFIG.messages.sound)
    if (settings.message)
      other.tell(`§7${player.name} ${JOIN.CONFIG.messages[messageType]}`)
  }

  player.onScreenDisplay.setTitle('')

  if (player.scores.joinTimes === 1) {
    EventSignal.emit(JOIN.EVENTS.firstTime, player)
  } else {
    EventSignal.emit(JOIN.EVENTS.join, player)
  }
}

new Command({
  name: 'join',
  description: 'Имитирует первый вход',
  type: 'admin',
}).executes(ctx => {
  EventSignal.emit(JOIN.EVENTS.firstTime, ctx.sender)
})

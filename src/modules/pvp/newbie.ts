import { EntityDamageCause, Player, system, world } from '@minecraft/server'
import { ask, Cooldown, Join, ms } from 'lib'
import { PlayerProperties } from 'lib/assets/player-json'
import { createLogger } from 'lib/utils/logger'

const newbieTime = ms.from('hour', 2)

const property = PlayerProperties['lw:newbie']

export function isNewbie(player: Player) {
  return !!player.database.survival.newbie
}

export function askForExitingNewbieMode(
  player: Player,
  reason: Text,
  callback: VoidFunction,
  back: VoidFunction = () => player.success('Успешно отменено'),
) {
  if (!isNewbie(player)) return callback()

  ask(
    player,
    'Если вы совершите это действие, вы потеряете статус новичка:\n - Другие игроки смогут наносить вам урон\n - Другие игроки смогут забирать ваш лут после смерти',
    '§cЯ больше не новичок',
    () => {
      exitNewbieMode(player, reason)
      callback()
    },
    'НЕТ, НАЗАД',
    back,
  )
}

const logger = createLogger('Newbie')

function exitNewbieMode(player: Player, reason: Text) {
  if (!isNewbie(player)) return

  player.warn(`§eВы ${reason}, поэтому вышли из режима новичка.`)
  delete player.database.survival.newbie
  player.setProperty(property, false)

  logger.player(player).info`Exited newbie mode because ${reason}`
}

export function enterNewbieMode(player: Player) {
  player.database.survival.newbie = 1
  player.scores.anarchyOnlineTime = 0
  player.setProperty(property, true)
}

Join.onFirstTimeSpawn.subscribe(enterNewbieMode)
Join.onMoveAfterJoin.subscribe(({ player }) => {
  const value = isNewbie(player)
  if (value !== player.getProperty(property)) player.setProperty(property, value)
})

const damageCd = new Cooldown(ms.from('min', 1), false)

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource: { damagingEntity, cause } }) => {
  if (!(hurtEntity instanceof Player)) return
  if (damage === -17179869184) return

  const health = hurtEntity.getComponent('health')
  const denyDamage = () => {
    logger.player(hurtEntity).info`Recieved damage ${damage}, health ${health?.currentValue}, with cause ${cause}`
    if (health) health.setCurrentValue(health.currentValue + damage)
    hurtEntity.teleport(hurtEntity.location)
  }

  if (hurtEntity.database.survival.newbie && cause === EntityDamageCause.fireTick) {
    denyDamage()
  } else if (damagingEntity instanceof Player && damagingEntity.database.survival.newbie) {
    if (damageCd.isExpired(damagingEntity)) {
      denyDamage()
      askForExitingNewbieMode(
        damagingEntity,
        'ударили игрока',
        () => void 0,
        () => damagingEntity.info('Будь осторожнее в следующий раз.'),
      )
    } else {
      exitNewbieMode(damagingEntity, 'снова ударили игрока')
    }
  }
})

new Command('newbie')
  .setPermissions('member')
  .setDescription('Используйте, чтобы выйти из режима новичка')
  .executes(ctx => {
    if (isNewbie(ctx.player)) {
      askForExitingNewbieMode(ctx.player, 'использовали команду', () => void 0)
    } else return ctx.error('Вы не находитесь в режиме новичка.')
  })
  .overload('set')
  .setPermissions('techAdmin')
  .setDescription('Вводит в режим новичка')
  .executes(ctx => {
    enterNewbieMode(ctx.player)
    ctx.player.success()
  })

system.runPlayerInterval(player => {
  if (isNewbie(player) && player.scores.anarchyOnlineTime > newbieTime)
    exitNewbieMode(player, 'провели на анархии больше 2 часов')
}, 'newbie mode exit')

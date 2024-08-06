import { EntityDamageCause, Player, world } from '@minecraft/server'
import { isBuilding, Join, prompt } from 'lib'
import { PlayerProperties } from 'lib/assets/player-properties'
import { t } from 'lib/text'
import { PlayerNameTagModifiers } from 'modules/indicator/playerNameTag'

const prefix = 'newbie'
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

  prompt(
    player,
    'Если вы совершите это действие, вы потеряете статус новичка:\n - Другие игроки смогут наносить вам урон\n - Другие игроки смогут забирать ваш лут после смерти',
    'Я больше не новичок',
    () => {
      exitNewbieMode(player, reason)
      callback()
    },
    'НЕТ, НАЗАД',
    back,
  )
}

export function exitNewbieMode(player: Player, reason: Text) {
  if (!isNewbie(player)) return

  player.warn(t.warn`Вы ${reason}, поэтому вышли из режима новичка.`)
  delete player.database.survival.newbie
  player.setProperty(property, false)
  player.log(prefix, 'Exited newbie mode because', reason)
}

function enterNewbieMode(player: Player) {
  player.database.survival.newbie = 1
  player.setProperty(property, true)
}

Join.onFirstTimeSpawn.subscribe(enterNewbieMode)

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource: { damagingEntity, cause } }) => {
  if (!(hurtEntity instanceof Player)) return
  if (damage === -17179869184) return

  const health = hurtEntity.getComponent('health')
  const denyDamage = () => {
    hurtEntity.log(
      prefix,
      'Recieved damage',
      damage.toFixed(2),
      'health',
      health?.currentValue.toFixed(2),
      'with cause',
      cause,
    )
    if (health) health.setCurrentValue(health.currentValue + damage)
    hurtEntity.teleport(hurtEntity.location)
  }

  if (hurtEntity.database.survival.newbie && cause === EntityDamageCause.fireTick) {
    denyDamage()
  } else if (damagingEntity instanceof Player && damagingEntity.database.survival.newbie) {
    denyDamage()
    askForExitingNewbieMode(
      damagingEntity,
      'ударили игрока',
      () => hurtEntity.applyDamage(damage, { damagingEntity, cause }),
      () => damagingEntity.info('Будь осторожнее в следующий раз.'),
    )
    // TODO When called multiple times in the same minute warn and auto exit newbie mode
  }
})

PlayerNameTagModifiers.push(p => (p.database.survival.newbie && !isBuilding(p) ? ' \n§bНовичок§r' : false))

new Command('newbie')
  .setPermissions('techAdmin')
  .setDescription('Вводит в режим новчика')
  .executes(ctx => {
    if (isNewbie(ctx.player)) {
      exitNewbieMode(ctx.player, 'ds htib')
    } else enterNewbieMode(ctx.player)
    ctx.reply('Успешно')
  })

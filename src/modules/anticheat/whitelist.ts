import { system, world } from '@minecraft/server'
import { DEFAULT_ROLE, is, ROLES, Settings } from 'lib'
import { defaultLang } from 'lib/assets/lang'
import { noI18n } from 'lib/i18n/text'
import { createLogger } from 'lib/utils/logger'

// Delay execution to move whitelist settings to the end of the settings menu
system.delay(() => {
  const whitelist = Settings.world(noI18n`WhiteList\n§7Белый список`, 'whitelist', {
    enabled: {
      name: 'Включен',
      description: 'Включен ли whitelist',
      value: false,
      onChange() {
        logger.info(whitelist.enabled ? 'Enabled' : 'Disabled')
      },
    },
    allowedRole: {
      name: 'Разрешенная роль',
      description: `Минимальная роль, с которой игрок может зайти на сервер. Роль по умолчанию при входе: ${ROLES[DEFAULT_ROLE].to(defaultLang)}`,
      value: Object.entriesStringKeys(ROLES),
    },
    kickText: {
      name: 'Текст при кике',
      value: 'Сервер пока закрыт.\nСледите за новостями на нашем дискорд сервере!',
    },
  })

  const logger = createLogger('whitelist')

  world.afterEvents.playerSpawn.subscribe(({ player }) => {
    if (!whitelist.enabled) return

    if (!is(player.id, whitelist.allowedRole)) {
      logger.player(player).info('Has been kicked')
      world.overworld.runCommand(`kick "${player.name}" "${whitelist.kickText}"`)
    }
  })

  system.delay(() => {
    if (whitelist.enabled) {
      logger.info('To disable, use /scriptevent whitelist:disable')
    }
  })

  system.afterEvents.scriptEventReceive.subscribe(
    event => {
      if (event.id === 'whitelist:enable') whitelist.enabled = true
      if (event.id === 'whitelist:disable') whitelist.enabled = false
    },
    { namespaces: ['whitelist'] },
  )
})

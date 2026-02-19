import { Settings } from 'lib/settings'

export const worldEditPlayerSettings = Settings.player('§6World§dEdit\n§7Настройки строителя мира', 'we', {
  noBrushParticles: {
    name: 'Партиклы кисти',
    description: 'Отключает партиклы у кисти',
    value: false,
  },
  enableMobile: {
    name: 'Мобильное управление',
    description: 'Включает мобильное управление',
    value: false,
  },
})

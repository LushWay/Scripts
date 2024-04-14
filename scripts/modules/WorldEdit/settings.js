import { Settings } from 'lib.js'

export const WE_PLAYER_SETTINGS = Settings.player('Строитель мира', 'we', {
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

import { Settings } from 'lib.js'

export const WE_PLAYER_SETTINGS = Settings.player('Строитель мира', 'we', {
  noBrushParticles: {
    name: 'Партиклы кисти',
    desc: 'Отключает партиклы у кисти',
    value: false,
  },
  enableMobile: {
    name: 'Мобильное управление',
    desc: 'Включает мобильное управление',
    value: false,
  },
})

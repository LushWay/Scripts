import { Settings } from 'lib'

export const WE_PLAYER_SETTINGS = Settings.player('§6World§dEdit', 'we', {
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

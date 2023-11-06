import { system, Vector, world } from '@minecraft/server'
import { Options } from 'xapi.js'
import './builders/ToolBuilder.js'
import './builders/WorldEditBuilder.js'

// Lazy load to prevent script spike
system.runTimeout(() => import('./commands/index.js'), 'command import', 40)

export const WE_PLAYER_SETTINGS = Options.player('Строитель мира', 'we', {
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

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  if (itemStack.typeId === 'we:dash') {
    source.teleport(
      Vector.add(source.location, Vector.multiply(source.getViewDirection(), 5))
    )
  }
})

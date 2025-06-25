import {
  Entity,
  EntityComponentTypes,
  EntityQueryOptions,
  EntityTypes,
  system,
  TicksPerSecond,
  world,
} from '@minecraft/server'
import { ms, Settings } from 'lib'
import { i18n } from 'lib/i18n/text'
import { createLogger } from 'lib/utils/logger'
import { gravestoneEntityTypeId, gravestoneGetOwner } from './death-quest-and-gravestone'

const logger = createLogger('cleanup')

const settings = Settings.world(i18n`Очистка\n§7От предметов/могилок`, 'cleanup', {
  enabled: {
    name: 'Включена',
    description: 'Определяет, включена очистка или нет',
    value: true,
  },

  gravestoneThreshold: {
    name: 'Лимит могилок одного игрока',
    value: 5,
  },

  gravestoneExpireTime: {
    name: 'Макс время жизни могилок',
    description:
      '(В минутах) Время, через которое могилка будет удалена, если кол-во могилок этого игрока превышает значение выше',
    value: 20,
  },

  itemTypeThreshold: {
    name: 'Лимит предметов одного типа',
    value: 500,
  },

  itemExpireTime: {
    name: 'Макс время жизни предметов',
    description:
      '(В минутах) Время, через которое предмет будет удален, если кол-во предметов такого типа превышает значение выше',
    value: 3,
  },
})

const property = 'cleanup:date'
const itemTypeId = 'minecraft:item'
const entityTypes = EntityTypes.getAll()
  .map(e => e.id)
  .filter(e => e !== itemTypeId && e !== gravestoneEntityTypeId)

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid || (entity.typeId !== itemTypeId && entity.typeId !== gravestoneEntityTypeId)) return
  entity.setDynamicProperty(property, Date.now())
})

system.runJobInterval(function* cleanupInterval() {
  if (!settings.enabled) return

  let i = 0

  const options: EntityQueryOptions = {
    excludeTypes: entityTypes,
  }

  const itemTime = ms.from('min', settings.itemExpireTime)
  const itemTypeThreshold = settings.itemTypeThreshold
  const gravestoneTime = ms.from('min', settings.gravestoneExpireTime)
  const gravestoneThreshold = settings.gravestoneThreshold

  for (const dimension of [world.overworld, world.nether, world.end]) {
    const itemTypes = new Map<string, Set<Entity>>()
    for (const entity of dimension.getEntities(options)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!settings.enabled) return

      i++
      if (i % 20 === 0) yield

      if (!entity.isValid) continue

      const typeId = entity.typeId
      let counterKey: string | undefined
      let expireTime: number | undefined
      let threshold: number | undefined

      if (typeId === itemTypeId) {
        const item = entity.getComponent(EntityComponentTypes.Item)
        if (!item) continue
        counterKey = item.itemStack.typeId
        expireTime = itemTime
        threshold = itemTypeThreshold
      } else if (typeId === gravestoneEntityTypeId) {
        counterKey = gravestoneGetOwner(entity)
        expireTime = gravestoneTime
        threshold = gravestoneThreshold
      }

      if (!counterKey || !expireTime || !threshold) continue

      const date = entity.getDynamicProperty(property)
      if (typeof date !== 'number' || Date.now() - date < expireTime) continue

      let counter = itemTypes.get(counterKey)
      if (!counter) itemTypes.set(counterKey, (counter = new Set<Entity>()))

      counter.add(entity)

      if (threshold > counter.size) {
        let ii = 0
        logger.info('Cleaning', counterKey, 'count:', counter.size, 'threshold:', threshold)
        for (const entityToRemove of counter) {
          ii++
          if (ii % 10 === 0) yield
          if (entityToRemove.isValid) entityToRemove.remove()
        }
      }
    }
    yield
  }
}, 10 * TicksPerSecond)

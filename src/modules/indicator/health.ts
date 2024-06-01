import { Entity, Player, system, world } from '@minecraft/server'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { util, Vector } from 'lib'

import { CustomEntityTypes } from 'lib/assets/config'
import { ClosingChatSet } from 'lib/extensions/player'
import { NOT_MOB_ENTITIES } from 'lib/region/config'
import { PlayerNameTagModifiers, setNameTag } from 'modules/indicator/playerNameTag'
import { isNotPlaying } from 'modules/world-edit/isBuilding'

// TODO Rewrite in class

interface BaseHurtEntity {
  hurtEntity: Entity
  damage: number
  expires: number
}

interface SeparatedHurtEntity {
  separated: true
  indicator: Entity
}

interface SingleHurtEntity {
  separated: false
}

class HealthIndicator {
  hurtEntities = new Map<string, (SeparatedHurtEntity | SingleHurtEntity) & BaseHurtEntity>()

  indicatorTag = 'HEALTH_INDICATOR'

  /** Entities that have nameTag "always_show": true and dont have boss_bar */
  alwaysShows: string[] = [MinecraftEntityTypes.Player]

  /** List of families to indicate health */
  allowedFamilies = ['monster']

  constructor() {
    // Show indicator on hurt
    world.afterEvents.entityHurt.subscribe(event => {
      if (event.damage === 0) return

      // Validate entity
      if (!event.hurtEntity.isValid()) return

      const { id } = event.hurtEntity
      if (!id || NOT_MOB_ENTITIES.includes(id)) return
      if (
        !event.hurtEntity.isValid() ||
        !(event.hurtEntity.matches({ families: this.allowedFamilies }) || event.hurtEntity instanceof Player)
      )
        return

      // Not trigget by close chat
      if (ClosingChatSet.has(event.hurtEntity.id)) return

      this.updateIndicator({ entity: event.hurtEntity, damage: Math.floor(event.damage) })
    })

    // Remove indicator
    world.afterEvents.entityDie.subscribe(event => {
      if (!event.deadEntity.isValid()) return

      const { id } = event.deadEntity
      if (!id) return

      const info = this.hurtEntities.get(id)
      if (!info) return

      if (info.separated) {
        try {
          info.indicator.remove()
        } catch {}
      }

      this.hurtEntities.delete(id)
    })

    system.runInterval(
      () => {
        const indicators = this.getIDs(this.getIndicators())
        const usedIndicators = new Set()
        const now = Date.now()

        for (const [id, info] of this.hurtEntities) {
          const entity = info.hurtEntity

          if (!entity || (info.damage === 0 && info.expires < now)) {
            if (info.separated && info.indicator.isValid()) info.indicator.remove()
            this.hurtEntities.delete(id)
            continue
          }

          if (info.separated) usedIndicators.add(info.indicator.id)
          this.updateIndicator({ entity, damage: -info.damage })
        }

        for (const indicator of indicators) {
          if (!usedIndicators.has(indicator.id) && indicator.entity.isValid()) {
            indicator.entity.remove()
          }
        }
      },
      'health indicator, damage reducer',
      10,
    )

    PlayerNameTagModifiers.push(p => {
      const bar = this.getBar(p)
      if (bar) return '\n' + bar
      else return false
    })
  }

  /** Gets damage indicator name depending on entity's currnet heart and damage applied */
  getBar(entity: Entity, hp = entity.getComponent('health')): string {
    if (entity instanceof Player && isNotPlaying(entity)) return ''

    const hurtEntity = this.hurtEntities.get(entity.id)
    if (!hp || !hurtEntity) return ''
    const maxHP = hp.defaultValue

    const s = 50
    const scale = maxHP <= s ? 1 : maxHP / s

    const full = ~~(maxHP / scale)
    const current = ~~(hp.currentValue / scale)
    const damage = ~~(hurtEntity.damage / scale)

    let bar = ''
    for (let i = 1; i <= full; i++) {
      if (i <= current) {
        bar += '§c' + this.barSymbol
        continue
      }
      if (i > current && i <= current + damage) {
        bar += '§e' + this.barSymbol
        continue
      }

      bar += '§7' + this.barSymbol
    }

    return bar
  }

  barSymbol = '|'

  updateIndicator({ entity, damage = 0 }: { entity: Entity; damage?: number }) {
    if (!entity.isValid()) return

    const info = this.createHurtEntityRecord(entity)

    if (damage > 0) info.expires = Date.now() + util.ms.from('sec', 10)
    info.damage = Math.max(0, info.damage + damage) // Do not allow values less then 0

    setNameTag(info.separated ? info.indicator : info.hurtEntity, () => this.getBar(entity))
    if (info.separated && entity.isValid()) {
      info.indicator.teleport(Vector.add(entity.getHeadLocation(), { x: 0, y: 1, z: 0 }))
    }
  }

  private createHurtEntityRecord(entity: Entity) {
    let info = this.hurtEntities.get(entity.id)
    if (!info) {
      const separated = !this.alwaysShows.includes(entity.typeId)
      const base = {
        hurtEntity: entity,
        expires: Date.now(),
        damage: 0,
      }

      if (separated) {
        info = {
          ...base,
          separated: true,
          indicator: this.spawnIndicator(entity),
        }
      } else {
        info = {
          ...base,
          separated: false,
        }
      }

      this.hurtEntities.set(entity.id, info)
    }

    return info
  }

  spawnIndicator(entity: Entity) {
    const indicator = entity.dimension.spawnEntity(CustomEntityTypes.FloatingText, entity.getHeadLocation())
    indicator.addTag(this.indicatorTag)
    return indicator
  }

  getIndicators() {
    return world.overworld.getEntities({
      type: CustomEntityTypes.FloatingText,
      tags: [this.indicatorTag],
    })
  }

  getIDs(entities: Entity[]) {
    return entities.map(entity => ({
      id: util.run(() => entity.id)[0],
      entity,
    }))
  }
}

export default new HealthIndicator()

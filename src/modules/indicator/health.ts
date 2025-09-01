import { Entity, system, world } from '@minecraft/server'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, ms, Vec } from 'lib'

import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { ClosingChatSet } from 'lib/extensions/player'
import { NOT_MOB_ENTITIES } from 'lib/region/config'
import { isNotPlaying } from 'lib/utils/game'
import { PlayerNameTagModifiers, setNameTag } from 'modules/indicator/player-name-tag'

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
  private hurtEntities = new Map<string, (SeparatedHurtEntity | SingleHurtEntity) & BaseHurtEntity>()

  private indicatorTag = 'HEALTH_INDICATOR'

  /** Entities that have nameTag "always_show": true and dont have boss_bar */
  alwaysShows: string[] = [MinecraftEntityTypes.Player]

  /** List of families to indicate health */
  allowedFamilies = ['monster', 'player']

  constructor() {
    // Show indicator on hurt
    this.showIndicatorOnHurt()

    // Remove indicator
    this.removeIndicatorOnDie()

    this.damageReducer()

    PlayerNameTagModifiers.push(p => {
      const bar = this.getBar(p)
      if (bar) return '\n' + bar
      else return false
    })
  }

  private showIndicatorOnHurt() {
    world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage }) => {
      if (
        damage <= 0 ||
        !hurtEntity.isValid ||
        NOT_MOB_ENTITIES.includes(hurtEntity.typeId) ||
        ClosingChatSet.has(hurtEntity.id) ||
        Boss.isBoss(hurtEntity)
      )
        return

      const matches =
        hurtEntity.matches({ families: this.allowedFamilies }) || (hurtEntity.isPlayer() && !hurtEntity.isSimulated())
      if (!matches) return

      this.updateIndicator({ entity: hurtEntity, damage: Math.floor(damage) })
    })
  }

  private removeIndicatorOnDie() {
    world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
      const info = this.hurtEntities.get(deadEntity.id)
      if (!info) return

      if (info.separated && info.indicator.isValid) {
        info.indicator.remove()
      }

      this.hurtEntities.delete(deadEntity.id)
    })
  }

  private damageReducer() {
    system.runInterval(
      () => {
        const indicators = this.getIDs(this.getIndicators())
        const usedIndicators = new Set()
        const now = Date.now()

        for (const [id, info] of this.hurtEntities) {
          const entity = info.hurtEntity

          if (info.damage === 0 && info.expires < now) {
            if (info.separated && info.indicator.isValid) info.indicator.remove()
            this.hurtEntities.delete(id)
            continue
          }

          if (info.separated) usedIndicators.add(info.indicator.id)
          this.updateIndicator({ entity, damage: -info.damage })
        }

        for (const indicator of indicators) {
          if (!usedIndicators.has(indicator.id) && indicator.entity.isValid) {
            indicator.entity.remove()
          }
        }
      },
      'health indicator, damage reducer',
      10,
    )
  }

  /** Gets damage indicator name depending on entity's currnet heart and damage applied */
  private getBar(entity: Entity, hp = entity.getComponent('health')): string {
    if (entity.isPlayer() && isNotPlaying(entity)) return ''

    const hurtEntity = this.hurtEntities.get(entity.id)
    if (!hp || !hurtEntity) return ''
    const maxHP = hp.defaultValue

    const s = 50
    const scale = maxHP <= s ? 1 : maxHP / s

    const full = ~~(maxHP / scale)
    const current = ~~(hp.currentValue / scale)
    const damage = ~~(hurtEntity.damage / scale)

    return this.fillBar(full, current, damage)
  }

  private barSymbol = '▌'

  private fillBar(full: number, current: number, damage: number) {
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

  private updateIndicator({ entity, damage = 0 }: { entity: Entity; damage?: number }) {
    if (!entity.isValid) return

    const info = this.createHurtEntityRecord(entity)

    if (damage > 0) info.expires = Date.now() + ms.from('sec', 10)
    info.damage = Math.max(0, info.damage + damage) // Do not allow values less then 0

    setNameTag(info.separated ? info.indicator : info.hurtEntity, () => this.getBar(entity))
    if (info.separated) info.indicator.teleport(Vec.add(entity.getHeadLocation(), { x: 0, y: 1, z: 0 }))
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

  private spawnIndicator(entity: Entity) {
    const indicator = entity.dimension.spawnEntity<CustomEntityTypes>(
      CustomEntityTypes.FloatingText,
      entity.getHeadLocation(),
    )
    indicator.addTag(this.indicatorTag)
    return indicator
  }

  private getIndicators() {
    return world.overworld.getEntities({
      type: CustomEntityTypes.FloatingText,
      tags: [this.indicatorTag],
    })
  }

  private getIDs(entities: Entity[]) {
    return entities.map(entity => {
      let id
      try {
        id = entity.id
      } catch {}

      return { id, entity }
    })
  }
}

export default new HealthIndicator()

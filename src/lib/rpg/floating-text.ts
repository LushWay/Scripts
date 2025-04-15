import { Entity, ShortcutDimensions, world } from '@minecraft/server'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { anyPlayerNear } from 'lib/player-move'
import { createLogger } from 'lib/utils/logger'
import { Vector } from 'lib/vector'

export class FloatingText {
  private static readonly dynamicProperty = 'floatingText'

  private static readonly typeId = CustomEntityTypes.FloatingText

  constructor(
    private id: string,
    private dimensionType: ShortcutDimensions,
  ) {}

  private entity: Entity | undefined

  hide() {
    if (!this.entity) this.entity = this.find()
    if (this.entity?.isValid) this.entity.remove()
  }

  update(location: Vector3, nameTag: string) {
    if (!anyPlayerNear(location, this.dimensionType, 30)) return

    location = Vector.add(location, { x: 0.5, y: 0.7, z: 0.5 })

    if (!this.entity) {
      this.entity = this.find()
      if (!this.entity) this.create(location)
    }

    if (this.entity?.isValid) {
      this.entity.teleport(location)
      this.entity.nameTag = nameTag
    } else {
      this.logger.warn('Entity is invalid')
      try {
        this.entity?.remove()
      } catch {}

      this.create(location)
    }
  }

  private create(location: Vector3) {
    this.entity = world[this.dimensionType].spawnEntity(FloatingText.typeId, location)
    this.entity.setDynamicProperty(FloatingText.dynamicProperty, this.id)
  }

  private find() {
    return world[this.dimensionType]
      .getEntities({ type: FloatingText.typeId })
      .find(e => e.getDynamicProperty(FloatingText.dynamicProperty) === this.id)
  }

  private logger = createLogger(`FloatingText ${this.id}`)
}

import { Entity, ShortcutDimensions, world } from '@minecraft/server'
import { CustomEntityTypes } from 'lib/assets/config'
import { isChunkUnloaded } from 'lib/game-utils'
import { Vector } from 'lib/vector'

export class FloatingText {
  private static readonly dynamicProperty = 'floatingText'

  private static readonly typeId = CustomEntityTypes.FloatingText

  constructor(
    private id: string,
    private dimensionId: ShortcutDimensions,
  ) {}

  private entity: Entity | undefined

  update(location: Vector3, nameTag: string) {
    if (isChunkUnloaded({ location, dimensionId: this.dimensionId })) {
      // return console.warn(this.prefix + 'Chunk is unloaded')
      return
    }

    location = Vector.add(location, { x: 0.5, y: 0.7, z: 0.5 })

    if (!this.entity) {
      this.entity = this.find()
      if (!this.entity) this.create(location)
    }

    if (this.entity?.isValid()) {
      this.entity.teleport(location)
      this.entity.nameTag = nameTag
    } else {
      console.warn(this.prefix + 'Entity is invalid')
    }
  }

  private create(location: Vector3) {
    this.entity = world[this.dimensionId].spawnEntity(FloatingText.typeId, location)
    this.entity.setDynamicProperty(FloatingText.dynamicProperty, this.id)
  }

  private find() {
    return world[this.dimensionId]
      .getEntities({ type: FloatingText.typeId })
      .find(e => e.getDynamicProperty(FloatingText.dynamicProperty) === this.id)
  }

  private get prefix() {
    return `[FloatingText][${this.id}] `
  }
}

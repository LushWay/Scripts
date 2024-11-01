import { Player } from '@minecraft/server'
import { Mail } from 'lib'
import { SphereArea } from 'lib/region/areas/sphere'
import { registerCreateableRegion } from 'lib/region/command'
import { registerSaveableRegion } from 'lib/region/database'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import { t } from 'lib/text'

interface BaseLDB extends JsonObject {
  level: number
  materials: Record<string, number>
  materialsMissing: Record<string, number>
  isRotting: boolean
}

export class BaseRegion extends RegionWithStructure {
  protected onCreate(): void {
    // Save structure with bigger radius for future upgrading
    const radius = this.area.radius
    try {
      if (this.area instanceof SphereArea) this.area.radius = 30
      this.structure.save()
    } catch (e) {
    } finally {
      if (this.area instanceof SphereArea) this.area.radius = radius
    }
  }

  linkedDatabase: BaseLDB = {
    level: 1,
    materials: {},
    materialsMissing: {},
    isRotting: false,
  }

  startRotting() {
    this.linkedDatabase.isRotting = true
    this.save()

    const message = t.error`База с владельцем ${this.ownerName} разрушена.`
    this.forEachOwner(player => {
      if (player instanceof Player) {
        player.fail(message)
      } else {
        Mail.send(
          player,
          message,
          'База была зарейжена. Сожалеем. Вы все еще можете восстановить ее, если она не сгнила полностью',
        )
      }
    })
  }

  onRottingInterval() {
    //
  }
}

registerSaveableRegion('base', BaseRegion)
registerCreateableRegion('Базы', BaseRegion)

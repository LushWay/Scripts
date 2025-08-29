import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { ModalForm, Region, regionTypes, Vec } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { noI18n } from 'lib/i18n/text'
import { SphereArea } from 'lib/region/areas/sphere'
import { WeBackup, WorldEdit } from '../lib/world-edit'
import { WorldEditTool } from '../lib/world-edit-tool'

interface Storage {
  version: number
  regionKind: string
  radius: number
  minDistance: number
  minDistanceSameKind: boolean
}

class RegionTool extends WorldEditTool<Storage> {
  id = 'create-region'
  typeId = Items.WeTool
  name = 'регион'

  storageSchema = {
    version: 2,
    regionKind: '',
    radius: 13,

    /** Min distance to nearest region */
    minDistance: 7,
    /** Min distance applies to regions with the same kind only */
    minDistanceSameKind: true,
  }

  editToolForm(slot: ContainerSlot, player: Player) {
    const storage = this.getStorage(slot)

    new ModalForm(this.name)
      .addDropdownFromObject(
        'Тип региона',
        Object.fromEntries(regionTypes.map(e => [e.region.kind, e.name]).filter(e => !!e[0]) as [string, string][]),
        { defaultValueIndex: storage.regionKind },
      )
      .addSlider('Радиус', 2, 30, 1, storage.radius)
      .addSlider('Мин. радиус до ближайшего региона', -1, 40, 1, storage.minDistance)
      .addToggle('Мин. радиус работает только с регионами такого же типа', storage.minDistanceSameKind)
      .show(player, (_, regionId, radius, minDistance, minDistanceSameKind) => {
        storage.regionKind = regionId
        storage.radius = radius
        storage.minDistance = minDistance
        storage.minDistanceSameKind = minDistanceSameKind

        slot.nameTag = noI18n`Создать регион ${regionTypes.find(e => e.region.kind === storage.regionKind)?.name}`
        this.saveStorage(slot, storage)
      })
  }

  onUse(player: Player, _: ItemStack, storage: Storage): void {
    if (!storage.regionKind) return

    const regionType = regionTypes.find(e => e.region.kind === storage.regionKind)
    if (!regionType)
      return player.onScreenDisplay.setActionBar(`§cUnknown region type: ${storage.regionKind}`, ActionbarPriority.High)

    const regions = storage.minDistanceSameKind ? regionType.region.getAll() : Region.regions
    if (storage.minDistance !== -1 && regions.some(r => r.area.isNear(player, storage.minDistance)))
      return player.onScreenDisplay.setActionBar(noI18n`§7Рядом другие регионы`, ActionbarPriority.High)

    const area = new SphereArea({ center: player.location, radius: storage.radius }, player.dimension.type)

    if (!area.isValid()) {
      const msg = noI18n.error`Area ${area.toString()} is invalid. Maybe too near to the world borders?`
      player.onScreenDisplay.setActionBar(msg, ActionbarPriority.High)
      return player.fail(msg)
    }

    const create = () => regionType.region.create(area)

    const region = create()
    const we = WorldEdit.forPlayer(player)
    we.backup(
      `Region create at ${Vec.string(Vec.floor(player.location), true)}`,
      undefined,
      undefined,
      undefined,
      name => new WeRegionBackup(name, region, create),
    )

    const msg = noI18n`§aРегион создан!`
    player.success(msg)
    player.onScreenDisplay.setActionBar(msg, ActionbarPriority.High)
  }
}

class WeRegionBackup implements WeBackup {
  constructor(
    public name: string,
    private region: Region | undefined,
    private createRegion: () => Region,
  ) {}

  type = (name: string) => new WeRegionBackup(name, this.region, this.createRegion)

  load() {
    this.region ? this.region.delete() : (this.region = this.createRegion())
  }

  delete(): void {
    // Nothing
  }
}

export const weRegionTool = new RegionTool()

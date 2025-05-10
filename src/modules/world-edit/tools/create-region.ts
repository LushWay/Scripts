import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { createableRegions, ModalForm, Region, Vector } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { SphereArea } from 'lib/region/areas/sphere'
import { t } from 'lib/text'
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
        Object.fromEntries(
          createableRegions.map(e => [e.region.kind, e.name]).filter(e => !!e[0]) as [string, string][],
        ),
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

        slot.nameTag = t`Создать регион ${createableRegions.find(e => e.region.kind === storage.regionKind)?.name}`
        this.saveStorage(slot, storage)
      })
  }

  onUse(player: Player, _: ItemStack, storage: Storage): void {
    if (!storage.regionKind) return

    const createableRegion = createableRegions.find(e => e.region.kind === storage.regionKind)
    if (!createableRegion)
      return player.onScreenDisplay.setActionBar(
        `§cUnknown region type: ${storage.regionKind}`,
        ActionbarPriority.Highest,
      )

    const regions = storage.minDistanceSameKind ? createableRegion.region.getAll() : Region.regions
    if (storage.minDistance !== -1 && regions.some(r => r.area.isNear(player, storage.minDistance)))
      return player.onScreenDisplay.setActionBar(`§7Рядом другие регионы`, ActionbarPriority.Highest)

    const create = () =>
      createableRegion.region.create(
        new SphereArea({ center: player.location, radius: storage.radius }, player.dimension.type),
      )
    create()

    const we = WorldEdit.forPlayer(player)
    we.backup(
      `Region create at ${Vector.string(Vector.floor(player.location), true)}`,
      undefined,
      undefined,
      undefined,
      name => new WeRegionBackup(name, create),
    )

    const msg = t`§aРегион создан!`
    player.success(msg)
    player.onScreenDisplay.setActionBar(msg, ActionbarPriority.Highest)
  }
}

class WeRegionBackup implements WeBackup {
  constructor(
    public name: string,
    private createRegion: () => Region,
    private onUndo: VoidFunction = () => {
      this.region?.delete()
    },
    private onRedo: VoidFunction = () => {
      this.region = this.createRegion()
    },
  ) {}

  private region: Region | undefined

  type = (name: string) => new WeRegionBackup(name, this.createRegion, this.onRedo, this.onUndo)

  load() {
    this.onUndo()
  }

  delete(): void {
    // Nothing
  }
}

export const weRegionTool = new RegionTool()

import { createableRegions, ModalForm, Region } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { SphereArea } from 'lib/region/areas/sphere'
import { t } from 'lib/text'
import { WorldEditTool } from '../lib/world-edit-tool'

export const weRegionTool = new WorldEditTool<{
  version: number
  regionKind: string
  radius: number
  minDistance: number
  minDistanceSameKind: boolean
}>({
  id: 'create-region',
  itemStackId: Items.WeTool,
  name: 'Регион',

  loreFormat: {
    version: 2,
    regionKind: '',
    radius: 13,

    /** Min distance to nearest region */
    minDistance: 7,
    /** Min distance applies to regions with the same kind only */
    minDistanceSameKind: true,
  },

  editToolForm(slot, player) {
    const lore = this.parseLore(slot.getLore())

    new ModalForm(this.name)
      .addDropdownFromObject(
        'Тип региона',
        Object.fromEntries(
          createableRegions.map(e => [e.region.kind, e.name]).filter(e => !!e[0]) as [string, string][],
        ),
        {
          defaultValueIndex: lore.regionKind,
        },
      )
      .addSlider('Радиус', 2, 30, 1, lore.radius)
      .addSlider('Мин. радиус до ближайшего региона', 2, 40, 1, lore.minDistance)
      .addToggle('Мин. радиус работает только с регионами такого же типа', lore.minDistanceSameKind)
      .show(player, (_, regionId, radius, minDistance, minDistanceSameKind) => {
        lore.regionKind = regionId
        lore.radius = radius
        lore.minDistance = minDistance
        lore.minDistanceSameKind = minDistanceSameKind

        slot.setLore(this.stringifyLore(lore))
      })
  },

  interval10(player, slot) {
    const lore = this.parseLore(slot.getLore())

    if (!lore.regionKind) return

    const createableRegion = createableRegions.find(e => e.region.kind === lore.regionKind)
    if (!createableRegion)
      return player.onScreenDisplay.setActionBar(
        `§cUnknown region type: ${lore.regionKind}`,
        ActionbarPriority.UrgentNotificiation,
      )

    const regions = lore.minDistanceSameKind ? createableRegion.region.instances() : Region.regions
    if (regions.some(r => r.area.isNear(player.location, lore.minDistance)))
      return player.onScreenDisplay.setActionBar(`§7Рядом другие регионы`, ActionbarPriority.PvP)

    createableRegion.region.create(
      new SphereArea({ center: player.location, radius: lore.radius }, player.dimension.type),
    )
    const msg = t`§aРегион создан!`
    player.success(msg)
    player.onScreenDisplay.setActionBar(msg, ActionbarPriority.UrgentNotificiation)
  },
})

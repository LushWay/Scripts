import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { onFullRegionTypeRestore } from 'lib/region/kinds/minearea'
import { BaseRegion } from '../region'

onFullRegionTypeRestore(BaseRegion, async base => {
  // Rotting complete
  await base.structure.place()
  base.dimension.setBlockType(base.area.center, MinecraftBlockTypes.Air)
  base.delete()
})

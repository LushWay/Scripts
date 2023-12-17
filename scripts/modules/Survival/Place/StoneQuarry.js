import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DefaultPlaceWithSafeArea } from 'modules/Survival/Place/Default.place.js'
import { Boss, util } from 'smapi.js'

class StoneQuarryBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('StoneQuarry')
  }
  witherBoss = new Boss({
    name: 'wither',
    displayName: 'Камнедробилка',
    entityTypeId: 'minecraft:' + MinecraftEntityTypes.Wither,
    bossEvent: false,
    respawnTime: util.ms.from('hour', 1),
  })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StoneQuarry = new StoneQuarryBuilder()

import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Boss } from 'smapi.js'

class StoneQuarryBuilder {
  witherBoss = new Boss({
    name: 'wither',
    entityTypeId: 'minecraft:' + MinecraftEntityTypes.Wither,
    displayName: 'Камнедробилка',
    bossEvent: false,

    // 1 час
    respawnTime: 1000 * 60 * 60,
  })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StoneQuarry = new StoneQuarryBuilder()

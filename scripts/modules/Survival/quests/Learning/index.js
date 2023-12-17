import { ItemStack, Player, Vector, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { tpMenuOnce } from 'modules/Survival/Features/builderTeleport.js'
import { randomTeleport } from 'modules/Survival/Features/randomTeleport.js'
import { INTERACTION_GUARD } from 'modules/Survival/config.js'
import { DELAYED_BLOCK_PLACE_DB } from 'modules/Survival/utils/breakRestore.js'
import { createPublicGiveItemCommand } from 'modules/Survival/utils/createPublicGiveItemCommand.js'
import { EditableLocation, SafeAreaRegion, util } from 'smapi.js'
import { LEARNING_L } from './lootTables.js'
import { LEARNING_Q } from './quest.js'

export const LEARNING = {
  QUEST: LEARNING_Q,
  LOOT_TABLE: LEARNING_L,
  RTP_LOCATION: new EditableLocation('learning_quest_rtp', { type: 'vector3+radius' }).safe,

  AXE: new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор'),
  /** @type {string[]} */
  AXE_BREAKS: Object.entries(MinecraftBlockTypes)
    .filter(e => e[0].match(/log/i))
    .map(e => e[1]),

  /** @type {SafeAreaRegion | undefined} */
  SAFE_AREA: void 0,
}

LEARNING.RTP_LOCATION.onLoad.subscribe(location => {
  new SafeAreaRegion({
    center: location,
    radius: location.radius,
    dimensionId: 'overworld',
  })
})

INTERACTION_GUARD.subscribe((_, __, ctx) => {
  if (
    ctx.type === 'break' &&
    ctx.event.itemStack?.is(LEARNING.AXE) &&
    LEARNING.AXE_BREAKS.includes(ctx.event.block.typeId)
  )
    return true
})

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) LEARNING_Q.enter(player)
})

world.afterEvents.playerBreakBlock.subscribe(event => {
  if (LEARNING.AXE_BREAKS.includes(event.brokenBlockPermutation.type.id)) {
    event.block.setType(event.brokenBlockPermutation.type.id.replace(/^stripped_/, '').replace(/_log$/, '_fence'))
    DELAYED_BLOCK_PLACE_DB[Vector.string(event.block.location)] = {
      typeId: event.brokenBlockPermutation.type.id,
      date: Date.now() + util.ms.from('min', 10),
    }
  }
})

createPublicGiveItemCommand('startwand', LEARNING.AXE)

/**
 * @param {Player} player
 */
export function randomTeleportPlayerToLearning(player) {
  if (!LEARNING.RTP_LOCATION.valid) {
    return tpMenuOnce(player)
  }

  const location = LEARNING.RTP_LOCATION
  const radius = Math.floor(location.radius / 2)

  randomTeleport(
    player,
    Vector.add(location, { x: radius, y: 0, z: radius }),
    Vector.add(location, { x: -radius, y: 0, z: -radius }),
    {
      elytra: false,
      teleportCallback() {
        player.tell('§a> §fВы были перемещены на случайную локацию.')
        player.playSound(SOUNDS.success)
      },
      keepInSkyTime: 20,
    }
  )
}

import { EquipmentSlot, ItemLockMode, ItemStack, Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEffectTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { LockAction, util } from 'lib.js'

const RTP_ELYTRA = new ItemStack(MinecraftItemTypes.Elytra, 1).setInfo(
  '§6Элитра перемещения',
  'Элитра перелета, пропадает на земле'
)
RTP_ELYTRA.lockMode = ItemLockMode.slot

/**
 * @type {Set<string>}
 */
const IN_SKY = new Set()
new LockAction(player => IN_SKY.has(player.id), '§cВ начале коснитесь земли!')

/**
 * Teleports a player randomly within a specified range
 * @param {Player} target - The player to teleport randomly
 * @param {Vector3} from - The starting position of the random teleportation
 * @param {Vector3} to - The ending position of the random teleportation
 * @param {object} options - An object containing optional parameters
 * @param {number} [options.y=200] - The height at which to teleport the player
 * @param {number} [options.fromYtoBlock=60] - The minimum distance between the player and the ground for the teleportation to be valid
 * @param {Dimensions} [options.dimension='overworld'] - The dimension in which to teleport the player
 * @param {boolean} [options.elytra=true] - Whether or not to give the player an elytra after teleportation
 * @param {number} [options.c=0] - A counter to prevent infinite recursion in case of invalid teleportation
 * @param {(location: Vector3) => void} [options.teleportCallback] - Function that calls after player teleport
 * @param {number} [options.keepInSkyTime=5] - The amount of time (in seconds) to keep the player in the air after teleportation
 * @returns {Vector3}
 */
export function randomTeleport(
  target,
  from,
  to,
  {
    y = 150,
    dimension = 'overworld',
    fromYtoBlock = 40,
    elytra = true,
    c = 0,
    teleportCallback = () => {},
    keepInSkyTime = 5,
  }
) {
  const x = Math.randomInt(from.x, to.x)
  const z = Math.randomInt(from.z, to.z)

  try {
    // TODO Load by tickingarea
    const hit = world[dimension].getBlockFromRay({ x, y: y - 2, z }, Vector.down)
    if (hit) {
      const { block } = hit
      if ((y - block.y < fromYtoBlock || block.isLiquid) && c < 10) {
        c++
        return randomTeleport(target, from, to, {
          y,
          dimension,
          fromYtoBlock,
          elytra,
          c,
          keepInSkyTime,
        })
      }
    }
  } catch (e) {
    util.error(e)
  }

  target.teleport(
    { x, y, z },
    {
      facingLocation: { x, y: y - 10, z },
      keepVelocity: false,
      dimension: world[dimension],
    }
  )

  util.catch(() => teleportCallback({ x, y, z }))
  IN_SKY.add(target.id)

  if (keepInSkyTime) {
    target.addEffect(MinecraftEffectTypes.SlowFalling, keepInSkyTime * 20, {
      showParticles: false,
      amplifier: 200,
    })
  }

  system.runTimeout(
    () => {
      if (elytra) {
        giveElytra(target, keepInSkyTime)
      } else {
        // TODO Set right time
        const blocks = y - fromYtoBlock
        const ticks = (blocks / 2) * 20
        target.addEffect(MinecraftEffectTypes.SlowFalling, ticks, {
          amplifier: 1,
          showParticles: false,
        })
      }
    },
    'random teleport keep in sky',
    keepInSkyTime
  )

  return { x, y, z }
}

/**
 *
 * @param {Player} player
 */
function giveElytra(player, c = 5) {
  const slot = player.getComponent('equippable')?.getEquipmentSlot(EquipmentSlot.Chest)

  if (!slot) return

  // Item in slot
  const item = slot.getItem()
  if (item) {
    const { container } = player
    if (!container) return
    if (container.emptySlotsCount) {
      container.addItem(item)
    } else {
      player.fail('§cСними нагрудник или свою элитру!')
      if (c) system.runTimeout(() => giveElytra(player, c--), 'giveElytra retry', 20)
    }
  }

  slot.setItem(RTP_ELYTRA)
  player.database.survival.rtpElytra = 1
}

system.runInterval(
  () => {
    for (const player of world.getPlayers()) {
      if (!player.isOnGround) continue
      if (IN_SKY.has(player.id)) {
        IN_SKY.delete(player.id)
        player.removeEffect(MinecraftEffectTypes.SlowFalling)
      }
      if (player.database.survival.rtpElytra) clearElytra(player)
    }
  },
  'clear rtp elytra',
  20
)

/**
 *
 * @param {Player} player
 */
function clearElytra(player) {
  const equippable = player.getComponent('equippable')
  if (!equippable) return
  const slot = equippable.getEquipmentSlot(EquipmentSlot.Chest)
  const item = slot.getItem()
  if (item && RTP_ELYTRA.is(item)) slot.setItem(undefined)
  delete player.database.survival.rtpElytra
}

import { Block, BlockPermutation, Player, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Cooldown, getBlockStatus, isLocationError, Mail, ms, Vector } from 'lib'
import { table } from 'lib/database/abstract'
import { playerPositionCache } from 'lib/player-move'
import { t } from 'lib/text'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { BaseRegion } from '../region'

const cooldowns = table<Record<string, unknown>>('baseCoooldowns', () => ({}))

const reviseMaterialsCooldown = new Cooldown(ms.from('min', 2), false, cooldowns.revise)
const takeMaterialsCooldown = new Cooldown(ms.from('day', 1), false, cooldowns.takeMaterials)
const rotCooldown = new Cooldown(ms.from('min', 30), false, cooldowns.rot)

system.runInterval(
  () => {
    for (const base of BaseRegion.instances()) {
      const block = getBlockStatus({ location: base.area.center, dimensionId: base.dimensionType })
      const isLoaded = isNearPlayers(base)
      if (block === 'unloaded' || !isLoaded) continue

      if (block.typeId === MinecraftBlockTypes.Barrel) {
        spawnParticlesInArea(base.area.center, Vector.add(base.area.center, Vector.one))

        if (reviseMaterialsCooldown.isExpired(base.id)) reviseMaterials(base)
        if (takeMaterialsCooldown.isExpired(base.id)) takeMaterials(base, block)
      } else startRotting(base)

      if (base.linkedDatabase.isRotting && rotCooldown.isExpired(base.id)) rot(base)
    }
  },
  'baseInterval',
  10,
)

function startRotting(base: BaseRegion) {
  if (base.linkedDatabase.isRotting) return

  base.linkedDatabase.isRotting = true
  base.save()

  const message = t.error`База с владельцем ${base.ownerName} разрушена.`
  base.forEachOwner(player => {
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

let revising = false
async function reviseMaterials(base: BaseRegion) {
  if (revising) return

  try {
    revising = true

    const materials = countMaterials()
    await forEachChangedBlock(base, block => {
      if (!block || block.isAir) return

      materials.add(block.typeId)
    })

    console.log('Base materials:', materials.result())
  } catch (e) {
    if (isLocationError(e)) return
    console.error('Unable to base revise materials:', e)
  } finally {
    revising = false
  }
}

function countMaterials() {
  const materials = new Map<string, number>()
  return {
    add(typeId: string) {
      const material = materials.get(typeId) ?? 0
      materials.set(typeId, material + 1)
    },
    result() {
      return Object.fromEntries(materials)
    },
  }
}

function getMaterials(base: BaseRegion, barrel: Block) {
  const container = barrel.getComponent('inventory')?.container
  if (!container) return

  const materialsCount = countMaterials()
  const slots = new Map()
  for (const [, slot] of container.slotEntries()) {
    const item = slot.getItem()
    if (!item) continue

    const { typeId } = item
    const { materials, materialsMissing } = base.linkedDatabase
    if (!(typeId in materials || typeId in materialsMissing)) continue

    materialsCount.add(typeId)
  }
  return { container, result: materialsCount.result() }
}

function takeMaterials(base: BaseRegion, barrel: Block) {
  if (Object.keys(base.linkedDatabase.materialsMissing).length) return startRotting(base)

  const materials = getMaterials(base, barrel)
  if (!materials) return
}

export function rot(base: BaseRegion) {
  //
}

function forEachChangedBlock(base: BaseRegion, callback: (block?: Block) => void) {
  return base.structure.forEachBlock((vector, savedPermutation) => {
    const block = base.dimension.getBlock(vector)
    if (savedPermutation && block && permutationEquals(block.permutation, savedPermutation)) return

    callback(block)
  })
}

function permutationEquals(a: BlockPermutation, b: BlockPermutation) {
  const bStates = b.getAllStates()
  for (const [state, value] of Object.entries(a.getAllStates())) {
    if (value !== bStates[state]) return false
  }
  return true
}

function isNearPlayers(base: BaseRegion) {
  for (const [, point] of playerPositionCache) {
    if (base.area.isNear(point, 20)) return true
  }

  return false
}

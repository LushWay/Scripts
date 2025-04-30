import { Block, BlockPermutation, ContainerSlot, Player, RawText, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ActionForm, Cooldown, getBlockStatus, isEmpty, isLocationError, Mail, ms, Vector } from 'lib'
import { table } from 'lib/database/abstract'
import { anyPlayerNearRegion } from 'lib/player-move'
import { onFullRegionTypeRestore } from 'lib/region/kinds/minearea'
import { scheduleBlockPlace, SCHEDULED_DB, unscheduleBlockPlace } from 'lib/scheduled-block-place'
import { itemNameXCount } from 'lib/shop/rewards'
import { t } from 'lib/text'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { BaseRegion } from '../region'

const takeMaterialsTime = __DEV__ ? ms.from('min', 5) : ms.from('day', 1)
const blocksReviseTime = __DEV__ ? ms.from('sec', 3) : ms.from('min', 2)
const materialsReviseTime = __DEV__ ? ms.from('sec', 1) : ms.from('min', 1)

const cooldowns = table<Record<string, unknown>>('baseCoooldowns', () => ({}))

const blocksToMaterialsCooldown = new Cooldown(blocksReviseTime, false, cooldowns.blocksToMaterials)
const reviseMaterialsCooldown = new Cooldown(materialsReviseTime, false, cooldowns.revise)
const takeMaterialsCooldown = new Cooldown(takeMaterialsTime, false, cooldowns.takeMaterials)

system.runInterval(
  () => {
    for (const base of BaseRegion.getAll()) {
      const block = getBlockStatus({ location: base.area.center, dimensionId: base.dimensionType })
      const isLoaded = anyPlayerNearRegion(base, 20)
      if (block === 'unloaded' || !isLoaded) continue

      if (block.typeId === MinecraftBlockTypes.Barrel) {
        spawnParticlesInArea(base.area.center, Vector.add(base.area.center, Vector.one))

        if (blocksToMaterialsCooldown.isExpired(base.id)) blocksToMaterials(base)
        if (reviseMaterialsCooldown.isExpired(base.id)) reviseMaterials(base, block)
        if (takeMaterialsCooldown.isExpired(base.id)) takeMaterials(base, block)
      } else startRotting(base)
    }
  },
  'baseInterval',
  10,
)

function baseRottingMenu(base: BaseRegion, player: Player, back?: VoidFunction) {
  const selfback = () => baseRottingMenu(base, player, back)
  const barrel = base.dimension.getBlock(base.area.center)
  const materials: RawText = {
    rawtext: Object.entries(base.ldb.materials).map(([typeId, amount]) => ({
      rawtext: [itemNameXCount({ typeId, amount }, '§f§l'), { text: '\n' }],
    })),
  }

  const form = new ActionForm(
    'Гниение базы',
    t.raw`Чтобы база не гнила, в бочке ежедневно должны быть следующие ресурсы:\n\n${materials}\n\nДо следующей проверки: ${t.time(takeMaterialsCooldown.getRemainingTime(base.id))}`,
  ).addButtonBack(back)

  if (barrel) form.addButton('Проверить блоки в бочке', () => (reviseMaterials(base, barrel), selfback()))

  form.show(player)
}

export function baseRottingButton(base: BaseRegion, player: Player, back?: VoidFunction) {
  let text = ''
  if (base.ldb.isRotting) {
    text = '§cБаза гниет!\n§4Срочно пополните материалы!'
  } else {
    text = `Поддержание базы`
  }

  return [text, baseRottingMenu.bind(null, base, player, back)] as const
}

async function startRotting(base: BaseRegion) {
  if (base.ldb.isRotting) return

  base.ldb.isRotting = true
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

  const { radius, center } = base.area
  await forEachChangedBlock(base, (_, savedPermutation, location) => {
    if (!savedPermutation || Vector.equals(base.area.center, location)) return

    // radius = 10
    // distance | restore time
    // 1 (chest)  9 hours
    // 6 (stone)  4 hours
    // This means that the far block is from
    // center the faster it will rot
    const distance = Vector.distance(location, center)
    const restoreTime = ms.from(__DEV__ ? 'min' : 'hour', radius - distance)

    scheduleBlockPlace({
      dimension: base.dimensionType,
      location: location,
      restoreTime: restoreTime,
      states: savedPermutation.getAllStates(),
      typeId: savedPermutation.type.id,
    })
  })
}

function stopRotting(base: BaseRegion) {
  if (!base.ldb.isRotting) return

  base.ldb.isRotting = false
  base.save()

  const { dimensionType } = base

  base.area.forEachVector(vector => {
    const schedule = SCHEDULED_DB[dimensionType].find(e => Vector.equals(e.location, vector))
    if (schedule) unscheduleBlockPlace(schedule)
  })
}

let revising = false
async function blocksToMaterials(base: BaseRegion) {
  if (revising) return false

  try {
    revising = true

    const materials = createMaterialsCounter()
    await forEachChangedBlock(base, block => {
      if (!block || block.isAir) return

      const typeId = block.getItemStack(1, true)?.typeId
      if (typeId) materials.add(typeId)
    })

    base.ldb.materials = materials.result()
    return true
  } catch (e) {
    if (!isLocationError(e)) console.error('Unable to revise base materials:', e)
    return false
  } finally {
    revising = false
  }
}

function countMaterialsInBarrel(base: BaseRegion, barrel: Block) {
  const container = barrel.getComponent('inventory')?.container
  if (!container) return

  const materialsCount = createMaterialsCounter()
  const typeIdsToSlots = new Map<string, ContainerSlot[]>()
  for (const [, slot] of container.slotEntries()) {
    const item = slot.getItem()
    if (!item) continue

    const { typeId } = item
    const { materials, materialsMissing } = base.ldb
    if (!(typeId in materials || typeId in materialsMissing)) continue

    const slots = typeIdsToSlots.get(typeId) ?? []
    typeIdsToSlots.set(typeId, slots.concat(slot))
    materialsCount.add(typeId, slot.amount)
  }

  // Save to cache in case block will be unloaded
  base.ldb.barrel = materialsCount.result()

  return typeIdsToSlots
}

function reviseMaterials(base: BaseRegion, barrel: Block) {
  const barrelSlots = countMaterialsInBarrel(base, barrel)
  if (!barrelSlots) return

  const missing = createMaterialsCounter(base.ldb.materials)
  for (const [typeId, amount] of Object.entries(base.ldb.barrel)) {
    missing.remove(typeId, amount)
  }

  base.ldb.materialsMissing = missing.result()
  console.log('reviseMaterials: Missing', base.ldb.materialsMissing)

  return barrelSlots
}

function takeMaterials(base: BaseRegion, barrel: Block) {
  const barrelSlots = reviseMaterials(base, barrel)
  const toTakeFromBarrel = createMaterialsCounter(base.ldb.toTakeFromBarrel)
  const barrelMaterials = createMaterialsCounter(base.ldb.barrel)

  if (!isEmpty(base.ldb.materialsMissing)) {
    startRotting(base)
  } else {
    stopRotting(base)

    // The problem with taking materials from barrel is that
    // barrel can be in unloaded chunk where we can't do
    // anything with block. Because of the we must instead
    // save blocks we need to take in the base.ldb.toTakeFromBarrel
    // and later when barrel is loaded again we merge them
    // with usual materials to take both of them
    const materials = createMaterialsCounter(base.ldb.materials)
    if (barrelSlots && !isEmpty(base.ldb.toTakeFromBarrel)) {
      for (const [typeId, amount] of Object.entries(base.ldb.toTakeFromBarrel)) {
        materials.add(typeId, amount)
      }
    }

    for (const material of Object.entries(materials.result())) {
      const [typeId] = material
      let [, amount] = material
      // Update barrel inventory cache
      barrelMaterials.remove(typeId, amount)

      if (!barrelSlots) {
        // Barrel unloaded, save for later removing
        toTakeFromBarrel.add(typeId, amount)
      } else {
        for (const slot of barrelSlots.get(typeId) ?? []) {
          if (amount <= 0) break

          amount -= slot.amount
          if (amount < 0) {
            // in this slot there is more items then we need
            slot.amount -= amount + slot.amount
          } else {
            // take all the items from this slot
            slot.setItem(undefined)
          }
        }
      }
    }
  }

  base.ldb.toTakeFromBarrel = toTakeFromBarrel.result()
  base.ldb.barrel = barrelMaterials.result()
  base.save()
}

onFullRegionTypeRestore(BaseRegion, async base => {
  // Rotting complete
  await base.structure.place()
  base.dimension.setBlockType(base.area.center, MinecraftBlockTypes.Air)
  base.delete()
})

function forEachChangedBlock(
  base: BaseRegion,
  callback: (block: Block | undefined, savedPermutation: BlockPermutation | undefined, location: Vector3) => void,
) {
  return base.structure.forEachBlock((location, savedPermutation) => {
    if (Vector.equals(location, base.area.center)) return

    const block = base.dimension.getBlock(location)
    if (savedPermutation && block && permutationEquals(block.permutation, savedPermutation)) return

    callback(block, savedPermutation, location)
  })
}

function permutationEquals(a: BlockPermutation, b: BlockPermutation) {
  if (a.type.id !== b.type.id) return false

  const bStates = b.getAllStates()
  for (const [state, value] of Object.entries(a.getAllStates())) {
    if (value !== bStates[state]) return false
  }
  return true
}

function createMaterialsCounter(from?: Record<string, number>) {
  const materials = new Map<string, number>(from && Object.entries(from))
  return {
    add(typeId: string, amount = 1) {
      const material = materials.get(typeId) ?? 0
      materials.set(typeId, material + amount)
    },
    remove(typeId: string, amount: number) {
      if (!materials.has(typeId)) return

      const material = materials.get(typeId) ?? 0
      const newAmount = material - amount
      if (newAmount > 0) materials.set(typeId, newAmount)
      else materials.delete(typeId)
    },
    result: () => Object.fromEntries(materials),
  }
}

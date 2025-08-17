import { Block, BlockPermutation, ContainerSlot, Player, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import {
  actionGuard,
  ActionGuardOrder,
  Cooldown,
  getBlockStatus,
  isEmpty,
  isLocationError,
  isNotPlaying,
  Mail,
  ms,
  Vec,
} from 'lib'
import { table } from 'lib/database/abstract'
import { form } from 'lib/form/new'
import { Message } from 'lib/i18n/message'
import { i18n } from 'lib/i18n/text'
import { anyPlayerNearRegion } from 'lib/player-move'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { itemNameXCount } from 'lib/utils/item-name-x-count'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { BaseRegion, RottingState } from '../region'

const takeMaterialsTime = __DEV__ ? ms.from('day', 1) : ms.from('day', 1)
const blocksReviseTime = __DEV__ ? ms.from('min', 1) : ms.from('min', 2)
const materialsReviseTime = __DEV__ ? ms.from('min', 1) : ms.from('min', 1)

const cooldowns = table<Record<string, unknown>>('baseCoooldowns', () => ({}))

const blocksToMaterialsCooldown = new Cooldown(blocksReviseTime, false, cooldowns.get('blocksToMaterials'))
const reviseMaterialsCooldown = new Cooldown(materialsReviseTime, false, cooldowns.get('revise'))
const takeMaterialsCooldown = new Cooldown(takeMaterialsTime, false, cooldowns.get('takeMaterials'))

system.runInterval(
  () => {
    for (const base of BaseRegion.getAll()) {
      if (!(base instanceof BaseRegion)) continue

      const block = getBlockStatus({ location: base.area.center, dimensionType: base.dimensionType })
      const isLoaded = anyPlayerNearRegion(base, 20)
      if (block === 'unloaded' || !isLoaded) continue

      spawnParticlesInArea(base.area.center, Vec.add(base.area.center, Vec.one))

      if (block.typeId === MinecraftBlockTypes.Barrel) {
        if (blocksToMaterialsCooldown.isExpired(base.id)) blocksToMaterials(base)
        if (reviseMaterialsCooldown.isExpired(base.id)) reviseMaterials(base, block)
        if (takeMaterialsCooldown.isExpired(base.id)) takeMaterials(base, block)
      } else startRotting(base, RottingState.Destroyed)
    }
  },
  'baseInterval',
  10,
)

function substractMaterials(a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>): number {
  const values: number[] = []
  for (const [ka, va] of Object.entries(a)) {
    let vb = b[ka]
    if (typeof vb === 'undefined') vb = 0
    values.push(vb / va)
  }

  const value = Math.min(...values)
  if (value < 0 || value === Infinity) return 0
  return value
}

export function getSafeFromRottingTime(base: BaseRegion) {
  const time = substractMaterials(base.ldb.materials, base.ldb.barrel)
  if (time === 0) return i18n.error`скоро начнется гниение`
  return i18n.hhmmss(time * takeMaterialsTime)
}

const baseRottingMenu = form.params<{ base: BaseRegion }>((f, { params: { base }, player }) => {
  const barrel = base.dimension.getBlock(base.area.center)
  if (barrel?.isValid) reviseMaterials(base, barrel)

  const materials = materialsToRString(base.ldb.materials, player)
  const barrelMaterials = materialsToRString(base.ldb.barrel, player)
  const missingMaterialsText = isEmpty(base.ldb.materialsMissing)
    ? i18n.success`Всех материалов хватает!\nБаза защищена от гниения на ${getSafeFromRottingTime(base)}§r\n`
    : i18n.error`Не хватает ресурсов:\n${materialsToRString(base.ldb.materialsMissing, player)}`

  f.title(i18n`Гниение базы`)
  f.body(
    i18n`Чтобы база не гнила, в бочке ежедневно должны быть следующие ресурсы:\n${materials}\nМатериалы в бочке:\n${barrelMaterials}\n${missingMaterialsText}\nДо следующего сбора ресурсов: ${i18n.hhmmss(takeMaterialsCooldown.getRemainingTime(base.id))}`,
  )
})

export function materialsToRString(ldbMaterials: Readonly<Record<string, number>>, player: Player): string {
  return (
    Object.entries(ldbMaterials)
      .map(([typeId, amount]) => itemNameXCount({ typeId, amount }, '§f§l', undefined, player.lang))
      .join('\n') + '§r'
  )
}

export function baseRottingButton(base: BaseRegion, player: Player, back?: VoidFunction) {
  let text: Message
  if (base.ldb.state === RottingState.NoMaterials) {
    text = i18n.nocolor`§cБаза гниет!\n§4Срочно пополните материалы!`
  } else if (base.ldb.state === RottingState.Destroyed) {
    text = i18n.nocolor`§cБаза разрушена!\n§4Срочно поставьте блок базы на ${Vec.string(base.area.center, true)}!`
  } else {
    text = i18n.nocolor`Состояние базы`
  }

  return [text, baseRottingMenu({ base })] as const
}

async function startRotting(base: BaseRegion, state: RottingState) {
  if (typeof base.ldb === 'undefined' || base.ldb.state === state) return

  base.ldb.state = state
  base.save()

  const messageAction = state === RottingState.NoMaterials ? i18n.error`гниет` : i18n.error`разрушена`
  const message = i18n.error`База с владельцем ${base.ownerName} ${messageAction}.`
  base.forEachOwner(player => {
    if (player instanceof Player) {
      player.fail(message)
    } else {
      Mail.send(
        player,
        message,
        state === RottingState.NoMaterials
          ? i18n`Нужно срочно положить материалы в бочку!`
          : i18n`База была зарейжена. Сожалеем. Вы все еще можете восстановить ее, если она не сгнила полностью`,
      )
    }
  })

  const { radius, center } = base.area
  await forEachChangedBlock(base, (_, savedPermutation, location) => {
    if (!savedPermutation || Vec.equals(base.area.center, location)) return

    // radius = 10
    // distance | restore time
    // 1 (chest)  9 hours
    // 6 (stone)  4 hours
    // This means that the far block is from
    // center the faster it will rot
    const distance = Vec.distance(location, center)
    const restoreTime = ms.from(__DEV__ ? 'min' : 'hour', radius - distance)

    ScheduleBlockPlace.setPermutation(savedPermutation, location, base.dimensionType, restoreTime)
  })
}

function stopRotting(base: BaseRegion) {
  base.area
    .forEachVector((v, isIn) => {
      if (isIn) ScheduleBlockPlace.deleteAt(v, base.dimensionType)
    }, 100)

    .catch((e: unknown) => console.error(e))

  if (base.ldb.state === RottingState.No) return

  base.ldb.state = RottingState.No
  base.save()
}

const blocksToSkip: string[] = [MinecraftBlockTypes.Sand, MinecraftBlockTypes.GrassBlock, MinecraftBlockTypes.Gravel]
let revising = false
async function blocksToMaterials(base: BaseRegion) {
  if (revising) return false

  try {
    revising = true

    const materials = createMaterialsCounter()
    await forEachChangedBlock(base, block => {
      if (!block || block.isAir || blocksToSkip.includes(block.typeId)) return

      const typeId = block.getItemStack(1, true)?.typeId
      if (typeId) materials.add(typeId)
    })

    base.ldb.materials = materials.result()
    base.save()
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

export function reviseMaterials(base: BaseRegion, barrel: Block) {
  const barrelSlots = countMaterialsInBarrel(base, barrel)
  if (!barrelSlots) return

  const missing = createMaterialsCounter(base.ldb.materials)
  for (const [typeId, amount] of Object.entries(base.ldb.barrel)) {
    missing.remove(typeId, amount)
  }

  base.ldb.materialsMissing = missing.result()
  console.log(`${base.ownerName} base reviseMaterialsMissing:`, base.ldb.materialsMissing)

  if (base.ldb.state === RottingState.Destroyed && barrel.isValid) base.ldb.state = RottingState.NoMaterials
  if (isEmpty(base.ldb.materialsMissing)) stopRotting(base)
  base.save()

  return barrelSlots
}

function takeMaterials(base: BaseRegion, barrel: Block) {
  const barrelSlots = reviseMaterials(base, barrel)
  const toTakeFromBarrel = createMaterialsCounter(base.ldb.toTakeFromBarrel)
  const barrelMaterials = createMaterialsCounter(base.ldb.barrel)

  if (!isEmpty(base.ldb.materialsMissing)) {
    startRotting(base, RottingState.NoMaterials)
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

function forEachChangedBlock(
  base: BaseRegion,
  callback: (block: Block | undefined, savedPermutation: BlockPermutation | undefined, location: Vector3) => void,
) {
  return base.structure.forEachBlock((location, savedPermutation) => {
    if (Vec.equals(location, base.area.center)) return

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

actionGuard((player, base, ctx) => {
  if (!(base instanceof BaseRegion) || isNotPlaying(player) || !base.isMember(player.id)) return

  if (base.ldb.state === RottingState.NoMaterials || base.ldb.state === RottingState.Destroyed) {
    if (
      (ctx.type === 'interactWithBlock' || ctx.type === 'place') &&
      Vec.equals(ctx.event.block.location, base.area.center)
    ) {
      system.delay(() => {
        console.log('revise')
        reviseMaterials(base, ctx.event.block)
      })
      // Allow interacting with base block or placing
      return true
    }

    if (base.ldb.state === RottingState.NoMaterials)
      player.fail(i18n.error`База гниет! Положите материалы из .base -> Гниение в бочку`)
    return base.ldb.state !== RottingState.NoMaterials
  }
}, ActionGuardOrder.BlockAction)

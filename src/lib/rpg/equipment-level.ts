import { EquipmentSlot, Player } from '@minecraft/server'

enum Level {
  None,
  Leather,
  Iron,
  Diamond,
  Netherite,
}

enum ArmorLevel {
  None,
  Leather,
  Chainmail,
  Golden,
  Iron,
  Diamond,
  Netherite,
}

enum ItemsLevel {
  None,
  Wooden,
  Stone,
  Golden,
  Iron,
  Diamond,
  Netherite,
}

enum Mode {
  /** Requires atleast one */
  Some,

  /** Requires half of items */
  Half,

  /** Requires every item to be same or better */
  Every,
}

function get(player: Player, mode = Mode.Half) {
  return Math.max(getArmorLevel(player, mode), getItemsLevel(player, mode))
}

function getArmorLevel(player: Player, mode = Mode.Half) {
  const eq = player.getComponent('equippable')
  console.log({
    abc: [EquipmentSlot.Chest, EquipmentSlot.Feet, EquipmentSlot.Head, EquipmentSlot.Legs].map(e =>
      eq?.getEquipment(e),
    ),
  })
  return checkMode(
    [EquipmentSlot.Chest, EquipmentSlot.Feet, EquipmentSlot.Head, EquipmentSlot.Legs].map(e => eq?.getEquipment(e)),
    ArmorLevel,
    mode,
    (item, id) => {
      console.log({ item: item?.typeId, a: item?.typeId.includes(id.toLowerCase()) })
      return !!item && item.typeId.includes(id.toLowerCase())
    },
  )
}

const itemsToRequire = ['sword', 'pickaxe']

function getItemsLevel(player: Player, mode = Mode.Half) {
  return checkMode(player.container?.entries(), ItemsLevel, mode, ([, item], id) => {
    return !!item && item.typeId.includes(id.toLowerCase()) && itemsToRequire.some(e => item.typeId.includes(e))
  })
}

function checkMode<T, L extends Record<string, number | string>>(
  array: T[] | undefined,
  levels: L,
  mode: Mode,
  checker: (item: T, id: keyof L) => boolean,
): ValueOf<L> {
  const levelNumbers = Object.values(levels)
    .filter(e => typeof e === 'number')
    .sort((a, b) => a - b) as ValueOf<L>[]

  const minLevel = levelNumbers.at(0)
  const maxLevel = levelNumbers.at(-1)

  if (!array) return minLevel

  console.log({ levelNumbers, minLevel, maxLevel, e: [...array.entries()], c: [Object.entriesStringKeys(levels)] })

  const results: Partial<Record<ValueOf<L>, number>> = {}

  for (const [i, item] of array.entries()) {
    for (const [id, level] of Object.entriesStringKeys(levels)) {
      if (id === minLevel || !isNaN(Number(id))) continue
      if (!checker(item, id)) continue

      results[level] ??= 0
      if (typeof results[level] === 'number') results[level]++

      const result = results[level] ?? 0
      const endOfArray = i === array.length - 1

      console.log({ results, level, endOfArray })

      switch (mode) {
        case Mode.Some:
          if (level === maxLevel || endOfArray) return level
          break
        case Mode.Half:
          if (result >= itemsToRequire.length / 2) return level
          break
        case Mode.Every:
          if (result >= itemsToRequire.length - 1) return level
      }
    }
  }
  return minLevel
}

function is(level: Level, player: Player) {
  return get(player) >= level
}

function isArmor(level: Level, player: Player) {
  return getArmorLevel(player) >= level
}

function isItems(level: Level, player: Player) {
  return getItemsLevel(player) >= level
}

export const EquippmentLevel = {
  Level,
  ArmorLevel,
  ItemsLevel,
  Mode,

  get,
  getArmorLevel,
  getItemsLevel,

  is,
  isArmor,
  isItems,
}

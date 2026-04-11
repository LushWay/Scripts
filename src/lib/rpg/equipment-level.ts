import { EquipmentSlot, Player } from '@minecraft/server'
import { register } from '@minecraft/server-gametest'
import { emoji } from 'lib/assets/emoji'
import { EventSignal } from 'lib/event-signal'
import { regionTypes } from 'lib/region'
import { ms } from 'lib/utils/ms'
import { WeakPlayerMap } from 'lib/weak-player-storage'

enum Level {
  None,
  Leather,
  Stone,
  Golden,
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

function getCompare(items: ItemsLevel, armor: ArmorLevel, mode = Mode.Half) {
  if (mode === Mode.Every) return Math.min(items, armor)
  return Math.max(items, armor)
}

function get(player: Player, mode = Mode.Half) {
  return getCompare(getItemsLevel(player, mode), getArmorLevel(player, mode), mode)
}

function getArmorLevel(player: Player, mode = Mode.Half) {
  const eq = player.getComponent('equippable')
  return checkMode(
    [EquipmentSlot.Chest, EquipmentSlot.Feet, EquipmentSlot.Head, EquipmentSlot.Legs].map(e => eq?.getEquipment(e)),
    ArmorLevel,
    mode,
    (item, id) => {
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

  const results: Partial<Record<ValueOf<L>, number>> = {}

  for (const [i, item] of array.entries()) {
    for (const [id, level] of Object.entriesStringKeys(levels)) {
      if (id === minLevel || !isNaN(Number(id))) continue
      if (!checker(item, id)) continue

      results[level] ??= 0
      if (typeof results[level] === 'number') results[level]++

      const result = results[level] ?? 0
      const endOfArray = i === array.length - 1

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

function is(level: Level, player: Player, mode = Mode.Half) {
  return get(player, mode) >= level
}

function isArmor(level: Level, player: Player) {
  return getArmorLevel(player) >= level
}

function isItems(level: Level, player: Player) {
  return getItemsLevel(player) >= level
}

const cache = new WeakPlayerMap<{ armor: ArmorLevel; items: ItemsLevel; expires: number }>()

const cacheUpdate = new EventSignal<{ player: Player; items: ItemsLevel; armor: ArmorLevel }>()

function getCached(player: Player): { armor: ArmorLevel; items: ItemsLevel } {
  const cached = cache.get(player)
  if (cached && cached.expires < Date.now()) return cached

  const items = getItemsLevel(player)
  const armor = getArmorLevel(player)
  cache.set(player, { armor, items, expires: Date.now() + ms.from('sec', 10) })
  EventSignal.emit(cacheUpdate, { player, armor, items })
  return { items, armor }
}

const emojiItems: Record<ArmorLevel, string> = {
  [ItemsLevel.None]: '',
  [ItemsLevel.Diamond]: emoji.custom.swords.diamond,
  [ItemsLevel.Netherite]: emoji.custom.swords.netherite,
  [ItemsLevel.Golden]: emoji.custom.swords.golden,
  [ItemsLevel.Stone]: emoji.custom.swords.stone,
  [ItemsLevel.Iron]: emoji.custom.swords.iron,
  [ItemsLevel.Wooden]: emoji.custom.swords.wooden,
}
const emojiArmor: Record<ArmorLevel, string> = {
  [ArmorLevel.None]: '',
  [ArmorLevel.Leather]: emoji.custom.armor.leather,
  [ArmorLevel.Chainmail]: emoji.custom.armor.chainmail,
  [ArmorLevel.Golden]: emoji.custom.armor.golden,
  [ArmorLevel.Diamond]: emoji.custom.armor.diamond,
  [ArmorLevel.Iron]: emoji.custom.armor.iron,
  [ArmorLevel.Netherite]: emoji.custom.armor.netherite,
}

const emojiLevel: Record<Level, string> = {
  [Level.None]: '',
  [Level.Leather]: getEmojiText(ArmorLevel.Leather, ItemsLevel.Wooden),
  [Level.Stone]: getEmojiText(ArmorLevel.Chainmail, ItemsLevel.Stone),
  [Level.Golden]: getEmojiText(ArmorLevel.Golden, ItemsLevel.Golden),
  [Level.Iron]: getEmojiText(ArmorLevel.Iron, ItemsLevel.Iron),
  [Level.Diamond]: getEmojiText(ArmorLevel.Diamond, ItemsLevel.Diamond),
  [Level.Netherite]: getEmojiText(ArmorLevel.Netherite, ItemsLevel.Netherite),
}

function getEmoji(player: Player) {
  const { items, armor } = getCached(player)
  return getEmojiText(armor, items)
}

function getEmojiText(armor: ArmorLevel, items: ItemsLevel) {
  return `${emojiArmor[armor]}${emojiItems[items]}`
}

export namespace EquippmentLevel {
  export type Global = Level

  export type Armor = ArmorLevel

  export type Items = ItemsLevel

  export type CheckMode = Mode
}

export const EquippmentLevel = {
  Level,
  ArmorLevel,
  ItemsLevel,
  Mode,

  get,
  getCompare,
  getArmorLevel,
  getItemsLevel,
  getCached,
  getEmoji,
  getEmojiText,

  is,
  isArmor,
  isItems,

  cacheUpdate,
  emojiLevel,
}

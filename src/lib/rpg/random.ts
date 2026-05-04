interface ChanceItem<T> {
  weight: number
  item: T
}

export function selectByChance<T>(items: ChanceItem<T>[]) {
  const totalChance = selectByChance.getTotalChance(items)
  let random = Math.randomFloat(0, totalChance)

  for (const [index, { weight: chance, item }] of items.entries()) {
    random -= chance
    if (random < 0) return { index, item }
  }

  return { index: 0, item: items[0]?.item as T }
}

selectByChance.getTotalChance = (items: { weight: number }[]) => {
  return items.reduce((sum, { weight: chance }) => sum + chance, 0)
}

/**
 * @example
 *   if (rollChance(10)) extraDamage()
 *
 * @param chance
 */
export function rollChance(chance: number) {
  chance = Math.min(Math.max(0, chance), 100)
  if (chance === 0) return false
  if (chance === 100) return true
  return Math.random() * 100 <= chance
}

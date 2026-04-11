/**
 * Creates a price curve generator.
 *
 * @param minPrice Price at minLevel
 * @param maxPrice Price at maxLevel
 * @param offset 0 = easier to progress at start, 0.5 = linear, 1 = easier to progress at end
 * @returns A function that accepts level bounds and returns a price calculator
 */
export function enchantmentPrice({
  offset = 0.5,
  minLevel = 1,
  maxLevel,
  minPrice,
  maxPrice,
  level,
}: {
  minPrice: number
  maxPrice: number
  minLevel?: number
  maxLevel: number
  level: number
  offset?: number
}): number {
  // Map offset to a power exponent.
  // offset 0   → exponent ~0.3 (concave down, steep early)
  // offset 0.5 → exponent 1   (linear)
  // offset 1   → exponent 3   (convex, steep late)
  offset = 1 - offset
  const exponent = Math.pow(10, 2 * offset - 1) // gives 0.1 … 10 range
  // Alternatively, simpler: const exponent = 0.3 + offset * 2.7; // 0.3 … 3.0

  const levelSpan = maxLevel - minLevel
  const priceSpan = maxPrice - minPrice

  // Clamp level to bounds
  const clamped = Math.min(maxLevel, Math.max(minLevel, level))
  const t = (clamped - minLevel) / levelSpan // 0 … 1

  // Power curve: t^exponent
  const factor = Math.pow(t, exponent)
  const price = minPrice + priceSpan * factor

  return Math.round(price) // Integer prices
}

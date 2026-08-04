export type Random = () => number

export const randomFor = (seed: number): Random => {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const shuffle = <T>(values: readonly T[], random: Random): T[] => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

export const hashNumbers = (values: readonly number[]): number => {
  let hash = 2166136261
  for (const value of values) hash = Math.imul(hash ^ value, 16777619)
  return hash >>> 0
}

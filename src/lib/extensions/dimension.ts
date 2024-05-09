import { Dimension } from '@minecraft/server'
import { expand } from './extend'

declare module '@minecraft/server' {
  /** Dimension names. Used in {@link Dimension.type} */
  type ShortcutDimensions = 'nether' | 'overworld' | 'end'

  interface Dimension {
    /** Dimension type shortcut ({@link Dimension.id} but without the namespace "minecraft:") */
    type: ShortcutDimensions
  }
}

expand(Dimension.prototype, {
  get type() {
    return this.id === 'minecraft:overworld' ? 'overworld' : this.id === 'minecraft:nether' ? 'nether' : 'end'
  },
})

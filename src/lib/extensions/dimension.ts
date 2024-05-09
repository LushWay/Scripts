import { Dimension } from '@minecraft/server'
import { expand } from './extend'

expand(Dimension.prototype, {
  get type() {
    return this.id === 'minecraft:overworld' ? 'overworld' : this.id === 'minecraft:nether' ? 'nether' : 'end'
  },
})

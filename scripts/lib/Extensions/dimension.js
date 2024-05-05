import { Dimension } from '@minecraft/server'
import { extend } from './extend.js'

extend(Dimension.prototype, {
  get type() {
    return this.id === 'minecraft:overworld' ? 'overworld' : this.id === 'minecraft:nether' ? 'nether' : 'end'
  },
})

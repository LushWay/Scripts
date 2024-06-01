import { ContainerSlot } from '@minecraft/server'
import { expand } from './extend'

expand(ContainerSlot.prototype, {
  getItem() {
    if (!this.hasItem()) return undefined

    return super.getItem()
  },
  get typeId() {
    if (!(this as ContainerSlot).hasItem()) return undefined

    return super.typeId
  },
})

import { ContainerSlot } from '@minecraft/server'
import { expand } from './extend'

expand(ContainerSlot.prototype, {
  getItem() {
    if (!this.hasItem()) return undefined

    return super.getItem()
  },
  get typeId() {
    if (!(this as any).hasItem?.()) return undefined

    return super.typeId
  },
})

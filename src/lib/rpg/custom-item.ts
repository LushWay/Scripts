import { ItemStack, system } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'

class CustomItem {
  constructor(public id: string) {
    system.run(() => (this.cache = this.itemStack))
  }

  private typeId: string

  setTypeId(typeId: string) {
    this.typeId = typeId
    return this
  }

  protected nameTag: string

  setNameTag(nameTag: string) {
    this.nameTag = nameTag
    return this
  }

  private description: string

  setDescription(desc: string) {
    this.description = desc
    return this
  }

  get itemStack() {
    if (!this.typeId) throw new TypeError('No type id specified for custom item ' + this.id)
    if (!this.nameTag) throw new TypeError('No type nameTag specified for custom item ' + this.id)
    if (!this.description) throw new TypeError('No type description specified for custom item ' + this.id)

    const item = new ItemStack(this.typeId).setInfo('§6' + this.nameTag, '§7' + this.description)
    return item
  }

  private cache?: ItemStack

  isItem(itemStack?: ItemStack) {
    if (!this.cache) return false
    return itemStack && this.cache.is(itemStack)
  }
}

export class CustomItemWithBlueprint extends CustomItem {
  get blueprint() {
    return new ItemStack(i.Paper).setInfo(
      '§fЧертеж предмета ' + this.nameTag,
      'С помощью него вы можете сделать предмет у инженера',
    )
  }
}

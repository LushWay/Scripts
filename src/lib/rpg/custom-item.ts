import { ItemStack, system } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'

class CustomItem {
  constructor(public id: string) {
    system.run(() => (this.cache = this.itemStack))
  }

  private _typeId: string | undefined

  typeId(typeId: string) {
    this._typeId = typeId
    return this
  }

  protected _nameTag: string | undefined

  nameTag(nameTag: string) {
    this._nameTag = nameTag
    return this
  }

  private _description: string | undefined

  lore(desc: string) {
    this._description = desc
    return this
  }

  get itemStack() {
    if (!this._typeId) throw new TypeError('No type id specified for custom item ' + this.id)
    if (!this._nameTag) throw new TypeError('No type nameTag specified for custom item ' + this.id)
    if (!this._description) throw new TypeError('No type description specified for custom item ' + this.id)

    const item = new ItemStack(this._typeId).setInfo('§6' + this._nameTag, '§7' + this._description)
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
      '§fЧертеж предмета ' + (this._nameTag ?? 'Неизвестный'),
      'С помощью него вы можете сделать предмет у инженера',
    )
  }
}

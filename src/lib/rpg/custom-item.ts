import { ItemStack, system } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { customItems } from 'modules/commands/getitem'

class CustomItem {
  constructor(public id: string) {
    system.run(() => this.onBuild())
  }

  protected onBuild() {
    this.cache = this.itemStack
    customItems.push(this.cache)
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

    const item = new ItemStack(this._typeId).setInfo(
      this._nameTag && `§6${this._nameTag}`,
      this._description && `§7${this._description}`,
    )
    return item
  }

  private cache?: ItemStack

  isItem(itemStack?: ItemStack) {
    if (!this.cache) return false
    return itemStack && this.cache.is(itemStack)
  }
}

export class CustomItemWithBlueprint extends CustomItem {
  protected onBuild(): void {
    super.onBuild()
    customItems.push(this.blueprint)
  }

  private _bprintName = 'Неизвестный'

  setBlueprintName(name: string) {
    this._bprintName = name
    return this
  }

  get blueprint() {
    return new ItemStack(i.Paper).setInfo(
      `§fЧертеж предмета ${this._nameTag ?? this._bprintName}`,
      'С помощью него вы можете сделать предмет у инженера',
    )
  }
}

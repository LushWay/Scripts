import { ItemStack, system } from '@minecraft/server'
import { Items } from 'lib/assets/custom-items'
import { defaultLang } from 'lib/assets/lang'
import { translateTypeId } from 'lib/i18n/lang'
import { i18n } from 'lib/i18n/text'

export const customItems: ItemStack[] = []

class CustomItem {
  constructor(public id: string) {
    system.run(() => this.onBuild())
  }

  protected onBuild() {
    this.cache = this.itemStack
    customItems.push(this.cache)
  }

  protected _typeId: string | undefined

  typeId(typeId: string) {
    this._typeId = typeId
    return this
  }

  protected _nameTag: string | undefined

  nameTag(nameTag: Text) {
    this._nameTag = nameTag.to(defaultLang)
    return this
  }

  private _description: string | undefined

  lore(desc: Text) {
    this._description = desc.to(defaultLang)
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

  private _bprintName = 'Unknown'

  setBlueprintName(name: string) {
    this._bprintName = name
    return this
  }

  get blueprint() {
    return new ItemStack(Items.Blueprint).setInfo(
      i18n`§fЧертеж предмета ${this._nameTag ?? (this._typeId ? translateTypeId(this._typeId, defaultLang) : this._bprintName)}`.to(
        defaultLang,
      ),
      i18n`С помощью него вы можете сделать предмет у инженера`.to(defaultLang),
    )
  }
}

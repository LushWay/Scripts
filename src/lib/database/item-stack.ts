import { ContainerSlot, InvalidContainerSlotError, ItemStack } from '@minecraft/server'
import { Items } from 'lib/assets/custom-items'
import { Language } from 'lib/assets/lang'
import { i18n, textUnitColorize } from 'lib/i18n/text'
import { noBoolean, wrapLore } from 'lib/util'

export class ItemLoreSchema<T extends TypeSchema, L extends Schema.Property.Any> {
  constructor(
    private schemaId: string,
    private itemTypeId = Items.Key,
  ) {}

  private properties: Schema = {}

  private currentProperty?: string

  property<N extends string, const D extends Schema.Property<Schema.Property.Saveable>>(
    name: N,
    defaultValue: D,
  ): ItemLoreSchema<T & Partial<Record<N, D>>, D>

  property<N extends string, const D extends Schema.Property<Schema.Property.Required>>(
    name: N,
    type: D,
  ): ItemLoreSchema<T & Record<N, D>, D>

  property<N extends string, const D extends Schema.Property.Any>(
    name: N,
    type: D,
  ): ItemLoreSchema<T & Record<N, D>, D> {
    this.currentProperty = name
    this.properties[name] = { type }

    return this as unknown as ItemLoreSchema<T & Record<N, D>, D>
  }

  display(text: Text, prepareProperty?: PrepareProperty<ParsedSchemaProperty<L>>) {
    if (!this.currentProperty) throw new Error('Create property first!')

    const property = this.properties[this.currentProperty]
    if (!property) throw new TypeError('Unknown property')

    property.text = text
    if (prepareProperty) property.prepareProperty = prepareProperty

    return this
  }

  private prepareNameTag: PrepareNameTag<T> | undefined

  nameTag(prepareNameTag: PrepareNameTag<T>) {
    this.prepareNameTag = prepareNameTag

    return this
  }

  lore(prepareLore: PrepareLore<T> | Text) {
    this.prepareLore = typeof prepareLore === 'function' ? prepareLore : p => [prepareLore, ...p]

    return this
  }

  build() {
    return new ItemLoreSchemaCompiled<T>(
      this.properties,
      (l, i, s) => this.prepareItem(l, i, s),
      this.itemTypeId,
      this.schemaId,
    )
  }

  private prepareItem(lang: Language, itemStack: Item, storage: ParsedSchema<T>) {
    if (this.prepareNameTag) itemStack.nameTag = '§r' + this.prepareNameTag(itemStack, storage).to(lang)
    itemStack.setLore(
      this.prepareLore(this.prepareProperties(lang, storage), itemStack, storage)
        .map(e => wrapLore(e.to(lang)))
        .flat(),
    )
  }

  private prepareLore: PrepareLore<T> = properties => properties

  private prepareProperties(lang: Language, storage: Partial<ParsedSchema<T>>): string[] {
    return Object.entries(this.properties)
      .map(([key, { text, prepareProperty }]) => {
        if (!text) return false

        const unit = prepareProperty ? prepareProperty(storage[key], key) : storage[key]
        if (unit === false) return false

        return `§7${text.to(lang)}: ${textUnitColorize(unit, undefined, lang)}`
      })
      .filter(noBoolean)
  }
}

export class ItemLoreSchemaCompiled<T extends TypeSchema> {
  static loreSchemaId = 'lsid'

  constructor(
    private properties: Schema,
    private prepareItem: (lang: Language, itemStack: Item, storage: ParsedSchema<T>) => void,
    private readonly itemTypeId: string,
    private readonly lsid: string,
  ) {}

  create(lang: Language, config: ParsedSchema<T>, typeId = this.itemTypeId) {
    const item = new ItemStack(typeId)
    item.setDynamicProperty(ItemLoreSchemaCompiled.loreSchemaId, this.lsid)

    const storage = this.parse(lang, item, config)
    if (!storage) throw new Error('Unable to create item using schema')

    for (const [key, value] of Object.entriesStringKeys(config)) storage[key] = value
    return { item, storage }
  }

  parse(lang: Language, itemStack: Item, defaultConfig: Partial<ParsedSchema<T>> = {}, prepare = true) {
    try {
      if (itemStack.isStackable) return
    } catch (e) {
      if (e instanceof InvalidContainerSlotError) return
      throw e
    }

    const lsid = itemStack.getDynamicProperty(ItemLoreSchemaCompiled.loreSchemaId)
    if (typeof lsid === 'string') {
      if (lsid !== this.lsid) return
    } else {
      if (lsid) console.warn(i18n.error`ItemLore: Invalid lsid, expected '${this.lsid}' but got ${lsid}`)
      return
    }

    const storage = {} as ParsedSchema<T>

    for (const [key, { type: defaultValue }] of Object.entries(this.properties)) {
      const isRequired = this.isRequired(defaultValue)
      const getSaved = () => itemStack.getDynamicProperty(key)
      if (typeof getSaved() !== 'string' && isRequired && typeof defaultConfig[key] === 'undefined') return

      Object.defineProperty(storage, key, {
        set: (v: Schema.Property.Saveable) => {
          itemStack.setDynamicProperty(key, v === defaultValue ? undefined : JSON.stringify(v))
          this.prepareItem(lang, itemStack, storage)
        },

        get() {
          const saved = getSaved()
          if (typeof saved === 'string') return JSON.parse(saved) as Schema.Property.Saveable
          if (!isRequired && typeof defaultValue !== 'undefined') return defaultValue
          return defaultConfig[key]
        },
        enumerable: true,
        configurable: false,
      })
    }

    if (prepare) this.prepareItem(lang, itemStack, storage)

    return storage
  }

  is(itemStack: ItemStack | ContainerSlot) {
    if (itemStack instanceof ContainerSlot) {
      if (!itemStack.isValid || !itemStack.hasItem()) return false
    }
    if (itemStack.isStackable) return false

    const lsid = itemStack.getDynamicProperty(ItemLoreSchemaCompiled.loreSchemaId)
    return lsid === this.lsid
  }

  private isRequired(property: Schema.Property.Any): boolean {
    return (
      (required as Schema.Property.Any[]).includes(property) ||
      (Array.isArray(property) && property.some(e => this.isRequired(e)))
    )
  }
}

export type ItemLoreStorage<T extends ItemLoreSchemaCompiled<TypeSchema>> = Exclude<ReturnType<T['parse']>, void>

const required = [Number, Boolean, String]

declare namespace Schema {
  namespace Property {
    type Required = (typeof required)[number]
    type Saveable = string | number | boolean

    type Any = Property<Saveable | Required>
  }

  type Property<T> = T | T[]
}

type Schema = Record<string, { type: Schema.Property.Any; text?: Text; prepareProperty?: PrepareProperty }>
type TypeSchema = Record<string, Schema.Property.Any>

type ParsedSchema<T extends TypeSchema> = {
  [K in keyof T]: ParsedSchemaProperty<T[K]>
}

type ParsedSchemaProperty<T extends Schema.Property.Any> = T extends StringConstructor
  ? string
  : T extends NumberConstructor
    ? number
    : T extends BooleanConstructor
      ? boolean
      : T extends StringConstructor[]
        ? string[]
        : T extends NumberConstructor[]
          ? number[]
          : T extends BooleanConstructor[]
            ? boolean[]
            : T

type Item = Pick<ItemStack, 'getDynamicProperty' | 'setDynamicProperty' | 'setLore' | 'isStackable' | 'nameTag'>

type PrepareProperty<U = any> = (unit: U, key: string) => Text | false

type PrepareLore<T extends TypeSchema> = (properties: string[], itemStack: Item, storage: ParsedSchema<T>) => Text[]

type PrepareNameTag<T extends TypeSchema> = (itemStack: Item, storage: ParsedSchema<T>) => Text

import { ContainerSlot, InvalidContainerSlotError, ItemStack } from '@minecraft/server'
import { CustomItems } from 'lib/assets/config'
import { t, textUnitColorize } from 'lib/text'
import { noBoolean, util } from 'lib/util'

export class ItemLoreSchema<T extends TypeSchema, L extends Schema.Property.Any> {
  constructor(
    private schemaId: string,
    private itemTypeId = CustomItems.Key,
  ) {}

  private properties: Schema = {}

  private currentProperty?: string

  property<N extends string, D extends Schema.Property<Schema.Property.Saveable>>(
    name: N,
    defaultValue: D,
  ): ItemLoreSchema<T & { [K in N]?: D }, D>

  property<N extends string, D extends Schema.Property<Schema.Property.Required>>(
    name: N,
    type: D,
  ): ItemLoreSchema<T & { [K in N]: D }, D>

  property<N extends string, D extends Schema.Property.Any>(name: N, type: D): ItemLoreSchema<T & { [K in N]: D }, D> {
    this.currentProperty = name
    this.properties[name] = { type }

    return this as unknown as ItemLoreSchema<T & { [K in N]: D }, D>
  }

  display(text: Text, prepareProperty?: PrepareProperty<ParsedSchemaProperty<L>>) {
    if (!this.currentProperty) throw new Error('Create property first!')

    this.properties[this.currentProperty].text = text
    if (prepareProperty) this.properties[this.currentProperty].prepareProperty = prepareProperty

    return this
  }

  private prepareNameTag: PrepareNameTag<T> | undefined

  nameTag(prepareNameTag: PrepareNameTag<T>) {
    this.prepareNameTag = prepareNameTag

    return this
  }

  lore(prepareLore: PrepareLore<T> | string) {
    this.prepareLore = typeof prepareLore === 'string' ? p => [prepareLore, ...p] : prepareLore

    return this
  }

  build() {
    return new ItemLore<T>(this.properties, (i, s) => this.prepareItem(i, s), this.itemTypeId, this.schemaId)
  }

  private prepareItem(itemStack: Item, storage: ParsedSchema<T>) {
    if (this.prepareNameTag) itemStack.nameTag = '§r' + this.prepareNameTag(itemStack, storage)
    itemStack.setLore(
      this.prepareLore(this.prepareProperties(storage), itemStack, storage)
        .map(e => util.wrapLore(e))
        .flat(),
    )
  }

  private prepareLore: PrepareLore<T> = properties => properties

  private prepareProperties(storage: Partial<ParsedSchema<T>>): string[] {
    return Object.entries(this.properties)
      .map(([key, { text, prepareProperty }]) => {
        if (!text) return false

        const unit = prepareProperty ? prepareProperty(storage[key], key) : storage[key]
        if (unit === false) return false

        return `§7${text}: ${textUnitColorize(unit)}`
      })
      .filter(noBoolean)
  }
}

class ItemLore<T extends TypeSchema> {
  static loreSchemaId = 'lsid'

  constructor(
    private properties: Schema,
    private prepareItem: (itemStack: Item, storage: ParsedSchema<T>) => void,
    private readonly itemTypeId: string,
    private readonly lsid: string,
  ) {}

  create(config: ParsedSchema<T>) {
    const item = new ItemStack(this.itemTypeId)
    item.setDynamicProperty(ItemLore.loreSchemaId, this.lsid)

    const storage = this.parse(item, config)
    if (!storage) throw new Error('Unable to create item using schema')

    for (const [key, value] of Object.entriesStringKeys(config)) storage[key] = value

    return { item, storage }
  }

  parse(itemStack: Item, defaultConfig: Partial<ParsedSchema<T>> = {}) {
    try {
      if (itemStack.isStackable) return
    } catch (e) {
      if (e instanceof InvalidContainerSlotError) return
      throw e
    }

    const lsid = itemStack.getDynamicProperty(ItemLore.loreSchemaId)
    if (typeof lsid === 'string') {
      if (lsid !== this.lsid) return
    } else {
      if (lsid) console.warn(t.error`ItemLore: Invalid lsid, expected '${this.lsid}' but got ${util.inspect(lsid)}`)
      return
    }

    const storage = {} as ParsedSchema<T>

    for (const [key, { type: defaultValue }] of Object.entries(this.properties)) {
      const isRequired = this.isRequired(defaultValue)

      Object.defineProperty(storage, key, {
        set: (v: Schema.Property.Saveable) => {
          itemStack.setDynamicProperty(key, v === defaultValue ? undefined : JSON.stringify(v))
          this.prepareItem(itemStack, storage)
        },

        get(): Schema.Property.Saveable {
          const saved = itemStack.getDynamicProperty(key)
          if (typeof saved === 'string') return JSON.parse(saved) as Schema.Property.Saveable
          if (defaultConfig[key]) return defaultConfig[key] as Schema.Property.Saveable

          if (isRequired) {
            throw new TypeError(`Item does not contains required value. Key: ${key}, default value: ${defaultValue}`)
          }

          return defaultValue as Schema.Property.Saveable
        },
        enumerable: true,
        configurable: false,
      })
    }

    this.prepareItem(itemStack, storage)

    return storage
  }

  is(itemStack: ItemStack | ContainerSlot) {
    if (itemStack.isStackable) return false

    const lsid = itemStack.getDynamicProperty(ItemLore.loreSchemaId)
    return lsid === this.lsid
  }

  private isRequired(property: Schema.Property.Any): boolean {
    return (
      (required as Schema.Property.Any[]).includes(property) ||
      (Array.isArray(property) && property.some(e => this.isRequired(e)))
    )
  }
}

export type ItemLoreStorage<T extends ItemLore<TypeSchema>> = Exclude<ReturnType<T['parse']>, void>

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

type PrepareProperty<U = unknown> = (unit: U, key: string) => string | false

type PrepareLore<T extends TypeSchema> = (properties: string[], itemStack: Item, storage: ParsedSchema<T>) => string[]

type PrepareNameTag<T extends TypeSchema> = (itemStack: Item, storage: ParsedSchema<T>) => string

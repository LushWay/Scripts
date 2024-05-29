import { ItemStack } from '@minecraft/server'
import { textUnitColorize } from 'lib/text'
import { noBoolean } from 'lib/util'

export class ItemLoreSchema<T extends Config> {
  constructor(private itemTypeId = 'sm:key') {}

  private properties: Properties = {}

  private currentProperty?: string

  property<N extends string, D extends Schema.Property<Schema.Property.Saveable>>(
    name: N,
    defaultValue: D,
  ): ItemLoreSchema<T & { [K in N]?: D }>
  property<N extends string, D extends Schema.Property<Schema.Property.Required>>(
    name: N,
    defaultValue: D,
  ): ItemLoreSchema<T & { [K in N]: D }>
  property<N extends string, D extends Schema.Property.Config>(
    name: N,
    defaultValue: D,
  ): ItemLoreSchema<T & { [K in N]: D }> {
    this.currentProperty = name
    this.properties[name] = { defaultValue }

    return this
  }

  display(text: Text) {
    if (!this.currentProperty) throw new Error('Create property first!')

    this.properties[this.currentProperty].text = text

    return this
  }

  lore(prepareLore: PrepareLore, prepareProperty?: PrepareProperty) {
    this.prepareLore = prepareLore
    if (prepareProperty) this.prepareProperty = prepareProperty

    return this
  }

  build() {
    return new ItemLore<T>(this.properties, (i, s) => this.setLore(i, s), this.itemTypeId)
  }

  private setLore(itemStack: Item, storage: Partial<ParsedConfig<T>>) {
    return itemStack.setLore(this.prepareLore(itemStack, this.prepareProperties(storage)))
  }

  private prepareLore: PrepareLore = (item, properties) => properties

  private prepareProperty: PrepareProperty = unit => textUnitColorize(unit)

  private prepareProperties(storage: Partial<ParsedConfig<T>>): string[] {
    return Object.entries(this.properties)
      .map(([key, { text }]) => {
        if (!text) return false
        return `§7${text}: ${this.prepareProperty(storage[key], key)}`
      })
      .filter(noBoolean)
  }
}

class ItemLore<T extends Config> {
  constructor(
    private properties: Properties,
    private setLore: (itemStack: Item, storage: Partial<ParsedConfig<T>>) => void,
    private readonly itemTypeId: string,
  ) {}

  create(config: ParsedConfig<T>) {
    const item = new ItemStack(this.itemTypeId)
    return { item, storage: this.parse(item, config) }
  }

  parse(itemStack: Item, defaultConfig: Partial<ParsedConfig<T>> = {}) {
    if (itemStack.isStackable) throw new Error('Only unstackable items are allowed!')

    const storage: Partial<ParsedConfig<T>> = {}

    for (const [key, { defaultValue }] of Object.entries(this.properties)) {
      const isRequired = this.isRequired(defaultValue)
      Object.defineProperty(storage, key, {
        set: (v: Schema.Property.Saveable) => {
          itemStack.setDynamicProperty(key, v === defaultValue ? undefined : JSON.stringify(v))
          this.setLore(itemStack, storage)
        },

        get(): Schema.Property.Saveable {
          const saved = itemStack.getDynamicProperty(key)
          if (typeof saved === 'string') return JSON.parse(saved)
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

    this.setLore(itemStack, storage)

    return storage as ParsedConfig<T>
  }

  private isRequired(property: Schema.Property.Config): boolean {
    return (
      (required as Schema.Property.Config[]).includes(property) ||
      (Array.isArray(property) && property.some(e => this.isRequired(e)))
    )
  }
}

const required = [Number, Boolean, String]

declare namespace Schema {
  namespace Property {
    type Required = ValueOf<typeof required>
    type Saveable = string | number | boolean

    type Config = Property<Saveable | Required>
  }

  type Property<T> = T | T[]
}

type Config = Record<string, { type: Schema.Property.Config; text?: Text }>
type ParsedConfig<T extends Config> = {
  [K in keyof T]: T[K] extends StringConstructor
    ? string
    : T[K] extends NumberConstructor
      ? number
      : T[K] extends BooleanConstructor
        ? boolean
        : T[K] extends StringConstructor[]
          ? string[]
          : T[K] extends NumberConstructor[]
            ? number[]
            : T[K] extends BooleanConstructor[]
              ? boolean[]
              : T[K]['type']
}

type Item = Pick<ItemStack, 'getDynamicProperty' | 'setDynamicProperty' | 'setLore' | 'isStackable'>

type PrepareProperty = (unit: unknown, key: string) => string

type PrepareLore = (itemStack: Item, properties: string[]) => string[]

type Properties = Record<
  string,
  {
    defaultValue: Schema.Property.Config
    text?: Text
  }
>

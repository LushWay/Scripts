import { ItemStack } from '@minecraft/server'

type PropertiesFormat = Record<string, string | number | boolean | Vector3 | undefined>

type ConfigType = 'string' | 'number' | 'boolean'
type Config = Record<string, ConfigType>
type ParseConfigFormat<T extends Config> = {
  [K in keyof T]: T[K] extends 'string' ? string : T[K] extends 'number' ? number : boolean
}

export class ItemStackWithDynamicProperties<Format extends PropertiesFormat = PropertiesFormat> {
  static create<Format extends Config>(format: Format) {
    return (itemStack: ItemStack) => new this<ParseConfigFormat<Format>>(itemStack, format)
  }

  private properties: PropertiesFormat

  constructor(
    private itemStack: ItemStack,
    protected readonly config: Config,
  ) {
    this.load()
  }

  load() {
    this.properties = {}
    for (const property of this.itemStack.getDynamicPropertyIds()) {
      const value = this.itemStack.getDynamicProperty(property)
      if (property in this.config && this.config[property].includes(typeof value as ConfigType)) {
        Reflect.set(this.properties, property, value)
      }
    }
  }

  get values() {
    return this.properties as Format
  }

  save() {
    for (const [key, value] of Object.entries(this.properties)) {
      this.itemStack.setDynamicProperty(key, value)
    }
  }
}

const KeyItemStack = ItemStackWithDynamicProperties.create({
  key: 'string',
  values: 'string',
})

import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Items } from 'lib/assets/custom-items'
import { getAuxOrTexture, getAuxTextureOrPotionAux } from 'lib/form/chest'
import { translateToken } from 'lib/i18n/lang'
import { ServerSideI18nMessage } from 'lib/i18n/message'
import { i18n } from 'lib/i18n/text'
import { Quest } from 'lib/quest'
import { Region } from 'lib/region'
import { Place } from 'lib/rpg/place'
import { VectorInDimension } from 'lib/utils/point'
import { Vec } from 'lib/vector'

export type ResourceDescripton = Text | ((player: Player) => Text)

export class Resource {
  static toText(details: ResourceDescripton | undefined, player: Player) {
    if (!details) return ''
    if (typeof details === 'function') return details(player)
    return details
  }

  constructor(
    readonly displayName: Text,
    readonly icon: string,
    private id: string,
  ) {}

  description?: ResourceDescripton

  setDescription(details: ResourceDescripton) {
    this.description = details
    return this
  }

  category: Text = i18n`Общие`

  categoryPriority = 0

  setCategory(category: Text, priority?: number) {
    this.category = category
    if (typeof priority === 'number') this.categoryPriority = priority
    return this
  }

  equals(resource: Resource) {
    return resource.id === this.id
  }
}

export abstract class NumberResource extends Resource {
  readonly amount = {
    min: 0,
    max: 0,
  }

  setAmount(min: number, max: number) {
    this.amount.min = min
    this.amount.max = max
    return this
  }
}

export class ExperienceLevelResource extends NumberResource {
  constructor() {
    super(i18n`Опыт`, getAuxOrTexture(MinecraftItemTypes.ExperienceBottle), 'xp')
  }
}

export class MoneyResource extends NumberResource {
  constructor() {
    super(i18n`Монеты`, getAuxOrTexture(Items.Money), 'money')
  }
}

export class ItemResource extends Resource {
  constructor(readonly itemStack: ItemStack) {
    super(
      itemStack.nameTag ??
        new ServerSideI18nMessage(i18n.style, l =>
          translateToken(itemStack.localizationKey, l).replace(/~LINEBREAK~.+/, ''),
        ),
      itemStack.typeId.includes('potion') ? getAuxTextureOrPotionAux(itemStack) : getAuxOrTexture(itemStack.typeId),
      'item',
    )

    this.categoryPriority = itemStack.typeId.startsWith('minecraft:') ? -1 : 0
  }

  equals(resource: Resource): boolean {
    if (!(resource instanceof ItemResource)) return false

    return this.itemStack.is(resource.itemStack)
  }
}

export abstract class ResourceLocation {
  constructor(
    readonly place: Place,
    readonly key: string,
  ) {}

  abstract reachQuest: Quest

  protected setDescription(d: Text) {
    this.description = d
    return this
  }

  protected description: Text = this.place.name
}

export class ResourceLocationRegion extends ResourceLocation {
  constructor(
    place: Place,
    readonly region: Region,
  ) {
    super(place, `region-${region.id}`)
  }

  reachQuest = new Quest(this.place, this.description, q => {
    q.reachRegion(this.region, i18n`Доберитесь до зоны`)
  })
}

export class ResourceLocationVectorInDimension extends ResourceLocation {
  constructor(
    place: Place,
    readonly vector: VectorInDimension,
  ) {
    super(place, `vector-${JSON.stringify(vector)}`)
  }

  reachQuest = new Quest(this.place, this.description, q => {
    q.reachArea(
      Vec.subtract(this.vector.location, Vec.one.multiply(2)),
      Vec.add(this.vector.location, Vec.one.multiply(2)),
      i18n`Доберитесь до точки`,
      this.vector.dimensionType,
    )
  })
}

export class ResourcesSource {
  static readonly resource: Resource

  static sources: ResourcesSource[] = []

  static getMap() {
    return this.sources.map(e => [e.resources, e] as const)
  }

  constructor() {
    ResourcesSource.sources.push(this)
  }

  readonly locations: ResourceLocation[] = []

  addLocation(location: ResourceLocation) {
    if (this.locations.some(e => e.place === location.place)) return
    this.locations.push(location)
  }

  readonly resources: Resource[] = []

  add(resource: Resource) {
    this.resources.push(resource)
  }

  delete() {
    ResourcesSource.sources = ResourcesSource.sources.filter(e => e !== this)
  }
}

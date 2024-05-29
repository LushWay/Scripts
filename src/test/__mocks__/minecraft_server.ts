import * as mc from '@minecraft/server'
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data'
import { EventSignal } from 'lib/event-signal'
import { vi } from 'vitest'

export class Container {}

export class Entity {
  id = 'test entity id'
  nameTag = 'test entity nameTag'
  teleport = vi.fn()
}

export class Player extends Entity {
  // @ts-expect-error AAAAAA
  static name() {
    return ''
  }

  constructor() {
    super()
    EventSignal.emit(
      (world.afterEvents as unknown as mc.WorldAfterEvents).playerJoin as unknown as EventSignal<any>,
      { playerId: this.id, playerName: this.name } as mc.PlayerJoinAfterEvent,
    )
    EventSignal.emit(
      (world.afterEvents as unknown as mc.WorldAfterEvents).playerSpawn as unknown as EventSignal<any>,
      { player: this as unknown as mc.Player, initialSpawn: true } as mc.PlayerSpawnAfterEvent,
    )
  }

  id = 'test player id'
  name = 'Test player name'
  nameTag = this.name

  private gamemode: GameMode = GameMode.survival
  getGameMode() {
    return this.gamemode
  }
  setGameMode(gameMode: GameMode) {
    this.gamemode = gameMode
  }
}

export class System {
  delay(fn: VoidFunction) {
    return this.run(fn)
  }

  run(fn: VoidFunction) {
    setImmediate(fn)
    return 0
  }

  runInterval = vi.fn()
  runTimeout = vi.fn()
  runJob = vi.fn()
}

export const system = new System()

function wrapEvents(events: WorldAfterEvents | WorldBeforeEvents) {
  return new Proxy(events as Record<string, EventSignal<any>>, {
    get(target, p, receiver) {
      if (typeof p === 'symbol') return Reflect.get(target, p, receiver)
      if (target[p]) return target[p]

      target[p] = new EventSignal()
      return target[p]
    },
  })
}

export class World {
  afterEvents = wrapEvents(new WorldAfterEvents())
  beforeEvents = wrapEvents(new WorldBeforeEvents())
  sendMessage = vi.fn()
  getPlayers() {
    return []
  }
  getDimension(id: MinecraftDimensionTypes) {
    return new Dimension(id)
  }
}

type DynamicPropertyValue = string | number | boolean | undefined | Vector3

class DynamicPropertiesProvider {
  private dynamicProperties: Record<string, DynamicPropertyValue> = {}
  getDynamicProperty(key: string) {
    return this.dynamicProperties[key]
  }
  setDynamicProperty(key: string, value: DynamicPropertyValue) {
    if (value === undefined) Reflect.deleteProperty(this.dynamicProperties, key)
    else this.dynamicProperties[key] = value
  }
  getDynamicPropertiesIds() {
    return Object.keys(this.dynamicProperties)
  }
}

export class WorldAfterEvents {}
export class WorldBeforeEvents {}

export const world = new World()

export class ItemStack extends DynamicPropertiesProvider {
  typeId: string

  constructor(
    public itemType: mc.ItemType | string,
    public amount: number = 1,
  ) {
    super()
    this.typeId = typeof itemType === 'string' ? itemType : itemType.id
  }

  private lore: string[] = []
  getLore() {
    return this.lore.slice()
  }
  setLore(lore: string[]) {
    this.lore = lore
  }

  clone() {
    return new ItemStack(this.typeId, this.amount)
  }
}

export class ContainerSlot {}

export class Dimension {
  constructor(public id: MinecraftDimensionTypes) {}
}

export enum GameMode {
  adventure = 'adventure',
  creative = 'creative',
  spectator = 'spectator',
  survival = 'survival',
}

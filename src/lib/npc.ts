import { Entity, PlayerInteractWithEntityBeforeEvent, World, system, world } from '@minecraft/server'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Temporary, isChunkUnloaded } from 'lib'
import { location } from './location'

type OnInteract = (event: Omit<PlayerInteractWithEntityBeforeEvent, 'cancel'>) => void | false

export interface NpcOptions {
  /** Unique identifier of the npc. Used to restore npc pointer after script reload */
  id: string
  /** Callback function that gets called on interact */
  onInteract: OnInteract
  /** NameTag of the npc */
  name: string
  group: string
  /** Dimension id */
  dimensionId?: Dimensions
  /** Index of the npc skin */
  skin?: number
}

export class Npc {
  static type = MinecraftEntityTypes.Npc

  static dynamicPropertyName = 'type'

  static npcs: Npc[] = []

  private readonly location

  private entity: Entity | undefined

  private readonly id: string

  private readonly dimensionId: Dimensions

  /** Creates new dynamically loadable npc */
  constructor(private options: NpcOptions) {
    this.id = options.id
    this.dimensionId = options.dimensionId ?? 'overworld'
    this.location = location(options.group, options.name)
    this.location.onLoad.subscribe(location => {
      if (this.entity) this.entity.teleport(location)
    })

    Npc.npcs.push(this)
  }

  addQuestInteraction(interaction: OnInteract) {
    this.questInteractions.add(interaction)
    return interaction
  }

  private questInteractions = new Set<OnInteract>()

  private onQuestInteraction: OnInteract = event => {
    for (const interaction of this.questInteractions) {
      if (interaction(event)) return // Return on first successfull interaction
    }
  }

  private spawn() {
    console.debug('Spawning npc')
    if (!this.location.valid) {
      throw new TypeError(`§cNpc(§r${this.id}§r§c): Location is not valid, spawn is impossible. Set location first`)
    }

    this.entity = world[this.dimensionId].spawnEntity(Npc.type, this.location)

    new Temporary(({ world, cleanup }) => {
      world.afterEvents.entitySpawn.subscribe(({ entity }) => {
        if (entity.id !== this.entity?.id) return

        this.configureNpcEntity(entity)
        cleanup()
      })
    })
  }

  private configureNpcEntity(entity: Entity) {
    const npc = entity.getComponent('npc')
    if (!npc) return

    entity.setDynamicProperty(Npc.dynamicPropertyName, this.id)
    npc.name = this.options.name
    if (typeof this.options.skin === 'number') npc.skinIndex = this.options.skin
  }

  static {
    world.beforeEvents.playerInteractWithEntity.subscribe(event => {
      if (event.target.typeId !== MinecraftEntityTypes.Npc) return
      if (event.player.isGamemode('creative') && event.player.isSneaking) return

      event.cancel = true
      system.run(() => {
        try {
          const npc = Npc.npcs.find(e => e.entity?.id === event.target.id)
          const component = event.target.getComponent('npc')
          const npcName = component ? component.name : event.target.nameTag

          if (!npc || npc.onQuestInteraction(event) === false || npc.options.onInteract(event) === false) {
            return event.player.fail(`§f${npcName}: §cЯ не могу с вами говорить. Приходите позже.`)
          }
        } catch (e) {
          event.player.fail('Не удалось открыть диалог. Сообщите об этом администрации.')
          console.error(e)
        }
      })
    })

    system.runInterval(
      () => {
        /** Store entities from each dimension so we are not grabbing them much */
        const cache: Partial<Record<Dimensions, { npc: ReturnType<World['getDynamicProperty']>; entity: Entity }[]>> =
          {}

        this.npcs.forEach(npc => {
          if (npc.entity) return // Entity already loaded

          const location = npc.location
          if (!location.valid) return
          if (isChunkUnloaded({ dimensionId: npc.dimensionId, location })) return

          const npcs = (cache[npc.dimensionId] ??= world[npc.dimensionId].getEntities({ type: Npc.type }).map(e => ({
            entity: e,
            npc: e.getDynamicProperty(Npc.dynamicPropertyName),
          })))

          const filteredNpcs = npcs.filter(e => e.npc === npc.id)
          console.debug({ filteredNpcs: filteredNpcs.length, npcs: npcs.length })

          if (filteredNpcs.length > 1) {
            console.debug('More then one')
            // More then one? Save only first one, kill others
            npc.entity = filteredNpcs.shift()?.entity

            filteredNpcs.forEach(e => e.entity.remove())
          } else {
            console.debug('Found one')
            npc.entity = filteredNpcs[0]?.entity
          }

          // Cannot find, spawn
          if (!npc.entity) npc.spawn()
          // Apply nameTag etc
          else npc.configureNpcEntity(npc.entity)
        })
      },
      'npc loading',
      20,
    )
  }
}

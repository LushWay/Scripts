import { Entity, PlayerInteractWithEntityBeforeEvent, World, system, world } from '@minecraft/server'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Temporary, isChunkUnloaded } from 'lib'
import { location } from './location'

export type EditableNpcProps = ConstructorParameters<typeof EditableNpc>[0]

type OnInteract = (event: Omit<PlayerInteractWithEntityBeforeEvent, 'cancel'>) => void | false

export class EditableNpc {
  static type = MinecraftEntityTypes.Npc

  static dynamicPropertyName = 'type'

  static npcs: EditableNpc[] = []

  dimensionId

  id

  location

  name

  onInteract

  skinIndex

  entity: Entity | undefined

  /**
   * Creates new dynamically loadable npc
   *
   * @param o - Options
   * @param o.id - Type name of the npc. Used to restore npc pointer after script reload
   * @param o.onInteract - Function that gets called on interact
   * @param o.name - NameTag of the npc
   * @param o.dimensionId - Dimension id
   * @param o.skin - Index of the npc skin
   */
  constructor({
    id,
    name,
    onInteract,
    dimensionId = 'overworld',
    group,
    skin,
  }: {
    id: string
    onInteract: OnInteract
    name: string
    group: string
    dimensionId?: Dimensions
    skin?: number
  }) {
    this.id = id
    this.name = name
    this.onInteract = onInteract
    this.dimensionId = dimensionId
    this.skinIndex = skin

    this.location = location(group, name)
    this.location.onLoad.subscribe(location => {
      if (this.entity) this.entity.teleport(location)
    })

    EditableNpc.npcs.push(this)
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

  spawn() {
    console.debug('Spawning npc')
    if (!this.location.valid) {
      throw new TypeError(`§cNpc(§r${this.id}§r§c): Location is not valid, spawn is impossible. Set location first`)
    }

    this.entity = world[this.dimensionId].spawnEntity(EditableNpc.type, this.location)

    new Temporary(({ world, cleanup }) => {
      world.afterEvents.entitySpawn.subscribe(({ entity }) => {
        if (entity.id !== this.entity?.id) return

        this.configureNpcEntity(entity)
        cleanup()
      })
    })
  }

  configureNpcEntity(entity: Entity) {
    const npc = entity.getComponent('npc')
    if (!npc) return

    entity.setDynamicProperty(EditableNpc.dynamicPropertyName, this.id)
    npc.name = this.name
    if (typeof this.skinIndex === 'number') npc.skinIndex = this.skinIndex
  }

  static {
    world.beforeEvents.playerInteractWithEntity.subscribe(event => {
      if (event.target.typeId !== MinecraftEntityTypes.Npc) return
      if (event.player.isGamemode('creative') && event.player.isSneaking) return

      event.cancel = true
      system.run(() => {
        try {
          const npc = EditableNpc.npcs.find(e => e.entity?.id === event.target.id)
          const component = event.target.getComponent('npc')
          const npcName = component ? component.name : event.target.nameTag

          if (!npc || npc.onQuestInteraction(event) === false || npc.onInteract(event) === false) {
            return event.player.fail(`§f${npcName}: §cЯ не могу с вами говорить. Приходите позже.`)
          }
        } catch (e) {
          event.player.fail('Не удалось открыть диалог. Сообщите об этом администрации.')
          console.error(e)
        }
      })
    })
  }
}
system.runInterval(
  () => {
    /** Store entities from each dimension so we are not grabbing them much */
    const cache: Partial<Record<Dimensions, { npc: ReturnType<World['getDynamicProperty']>; entity: Entity }[]>> = {}

    EditableNpc.npcs.forEach(npc => {
      if (npc.entity) return // Entity already loaded

      const location = npc.location
      if (!location.valid) return

      if (isChunkUnloaded({ dimensionId: npc.dimensionId, location })) return

      const npcs = (cache[npc.dimensionId] ??= world[npc.dimensionId]
        .getEntities({
          type: EditableNpc.type,
        })

        .map(e => ({
          entity: e,
          npc: e.getDynamicProperty(EditableNpc.dynamicPropertyName),
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
        //

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

import { Entity, EntityLifetimeState, PlayerInteractWithEntityBeforeEvent, system, world } from '@minecraft/server'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Temporary, Vector, isChunkUnloaded } from 'lib'
import { developersAreWarned } from 'lib/assets/text'
import { Core } from 'lib/extensions/core'
import { location } from 'lib/location'
import { t } from 'lib/text'
import { Place } from './place'

declare namespace Npc {
  type OnInteract = (event: Omit<PlayerInteractWithEntityBeforeEvent, 'cancel'>) => void | false
}

export class Npc {
  static type = MinecraftEntityTypes.Npc

  static dynamicPropertyName = 'type'

  static npcs: Npc[] = []

  location

  private entity: Entity | undefined

  private readonly id: string

  readonly dimensionId: Dimensions

  /** Creates new dynamically loadable npc */
  constructor(
    private point: Place,
    private onInteract: Npc.OnInteract,
  ) {
    this.id = point.fullId
    this.dimensionId = point.group.dimensionId
    this.location = location(point)
    this.location.onLoad.subscribe(location => {
      if (this.entity) this.entity.teleport(location)
      this.location = location
    })

    Npc.npcs.push(this)
  }

  addQuestInteraction(interaction: Npc.OnInteract) {
    this.questInteractions.add(interaction)
    return interaction
  }

  private questInteractions = new Set<Npc.OnInteract>()

  private onQuestInteraction: Npc.OnInteract = event => {
    for (const interaction of this.questInteractions) {
      if (interaction(event) !== false) return // Return on first successfull interaction
    }
  }

  private spawn() {
    console.debug('Spawning npc at ' + Vector.string(this.location as Vector3))
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
    npc.name = '§6§l' + this.point.name
    if (this.location.valid) entity.teleport(this.location)
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

          if (!npc || npc.onQuestInteraction(event) === false || npc.onInteract(event) === false) {
            return event.player.fail(`§f${npcName}: §cЯ не могу с вами говорить. Приходите позже.`)
          }
        } catch (e) {
          event.player.warn(`Не удалось открыть диалог. ${developersAreWarned}`)
          console.error(e)
        }
      })
    })

    Core.afterEvents.worldLoad.subscribe(() => {
      system.runInterval(
        () => {
          this.npcs.forEach(npc => {
            if (npc.entity) return // Entity already loaded
            if (isChunkUnloaded(npc)) return

            const npcs = world[npc.dimensionId].getEntities({ type: Npc.type }).map(e => ({
              entity: e,
              npc: e.getDynamicProperty(Npc.dynamicPropertyName),
            }))

            const filteredNpcs = npcs.filter(e => e.npc === npc.id)
            console.debug(
              t`${'NpcLoading'}: all: ${npcs.length}, filtered: ${filteredNpcs.length}, action: ${filteredNpcs.length > 1 ? 'removing' : 'none'}`,
            )

            if (filteredNpcs.length > 1) {
              // More then one? Save only first one, kill others
              npc.entity = filteredNpcs.find(e => e.entity.isValid() && e.entity.lifetimeState === EntityLifetimeState.Loaded && e.entity.getComponent('npc')?.skinIndex !== 0)?.entity
              
              if (npc.entity) filteredNpcs.forEach(e => e.entity.id !== npc.entity?.id && e.entity.remove())
            } else {
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
    })
  }
}

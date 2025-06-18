import {
  Entity,
  LocationInUnloadedChunkError,
  Player,
  PlayerInteractWithEntityBeforeEvent,
  system,
  world,
} from '@minecraft/server'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { developersAreWarned } from 'lib/assets/text'
import { Core } from 'lib/extensions/core'
import { LF, LoreForm } from 'lib/form/lore'
import { form, NewFormCallback, NewFormCreator } from 'lib/form/new'
import { ConfigurableLocation, location } from 'lib/location'
import { anyPlayerNear } from 'lib/player-move'
import { Temporary } from 'lib/temporary'
import { createLogger } from 'lib/utils/logger'
import { Place } from './place'

export declare namespace Npc {
  type OnInteract = (event: Omit<PlayerInteractWithEntityBeforeEvent, 'cancel'>) => boolean
}

export class Npc {
  static type = MinecraftEntityTypes.Npc

  static dynamicPropertyName = 'type'

  static npcs: Npc[] = []

  location: ConfigurableLocation<Vector3>

  private entity: Entity | undefined

  private readonly id: string

  readonly dimensionId: DimensionType

  static form(
    point: Place,
    creator: (form: NewFormCreator, ctx: { npc: Npc; player: Player; back?: NewFormCallback; lf: LF }) => void,
  ) {
    const npc = new Npc(point, ({ player }) => {
      form((f, _, back) => {
        f.title(point.name)

        const lf = new LoreForm(point.id, f, player)
        creator(f, { npc, player, back, lf })
        lf.renderHistory()
      }).show(player)
      return true
    })
    return npc
  }

  /** Creates new dynamically loadable npc */
  constructor(
    readonly point: Place,
    private onInteract: Npc.OnInteract,
  ) {
    this.id = point.id
    this.dimensionId = point.group.dimensionType
    this.location = location(point)
    this.location.onLoad.subscribe(location => {
      if (this.entity) this.entity.teleport(location)
      this.location = location
    })

    Npc.npcs.push(this)
  }

  questInteractions = new Set<Npc.OnInteract>()

  private onQuestInteraction: Npc.OnInteract = event => {
    for (const interaction of this.questInteractions) {
      if (interaction(event)) return true // Return on first successfull interaction
    }
    return false
  }

  get name() {
    return this.point.name
  }

  private spawn() {
    Npc.logger.info`Spawning at ${this.location}`
    if (!this.location.valid) {
      throw new TypeError(`§cNpc(§r${this.id}§r§c): Location is not valid, spawn is impossible. Set location first`)
    }

    try {
      this.entity = world[this.dimensionId].spawnEntity(Npc.type, this.location)

      new Temporary(({ world, cleanup }) => {
        world.afterEvents.entitySpawn.subscribe(({ entity }) => {
          if (entity.id !== this.entity?.id) return

          this.configureNpcEntity(entity)
          cleanup()
        })
      })
    } catch (e) {
      if (e instanceof LocationInUnloadedChunkError) return
      Npc.logger.error(e)
    }
  }

  private configureNpcEntity(entity: Entity) {
    const npc = entity.getComponent('npc')
    if (!npc) return

    entity.setDynamicProperty(Npc.dynamicPropertyName, this.id)
    npc.name = '§6§l' + this.point.name
    if (this.location.valid) entity.teleport(this.location)
  }

  static logger = createLogger('Npc')

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

          if (!npc || !(npc.onQuestInteraction(event) || npc.onInteract(event))) {
            return event.player.fail(`§f${npcName}: §cЯ не могу с вами говорить. Приходите позже.`)
          }
        } catch (e) {
          event.player.warn(`Не удалось открыть диалог. ${developersAreWarned}`)
          this.logger.error(e)
        }
      })
    })

    Core.afterEvents.worldLoad.subscribe(() => {
      system.runInterval(
        () => {
          this.npcs.forEach(npc => {
            if (npc.entity || !npc.location.valid) return // Entity already loaded
            if (!anyPlayerNear(npc.location, npc.dimensionId, 10)) return

            const npcs = world[npc.dimensionId].getEntities({ type: Npc.type }).map(e => ({
              entity: e,
              npc: e.getDynamicProperty(Npc.dynamicPropertyName),
            }))

            const filteredNpcs = npcs.filter(e => e.npc === npc.id)
            this.logger
              .info`all: ${npcs.length}, filtered: ${filteredNpcs.length}, action: ${filteredNpcs.length > 1 ? 'removing' : 'none'}`

            if (filteredNpcs.length > 1) {
              // More then one? Save only first one, kill others
              npc.entity = filteredNpcs.find(
                e => e.entity.isValid && e.entity.getComponent('npc')?.skinIndex !== 0,
              )?.entity

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

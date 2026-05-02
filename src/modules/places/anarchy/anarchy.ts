import { GameMode, Player } from '@minecraft/server'

import { consoleLang } from 'lib/assets/lang'
import { InventoryStore } from 'lib/database/inventory'
import { EventSignal } from 'lib/event-signal'
import { i18n, noI18n, noI18nShared } from 'lib/i18n/text'
import { location, ValidLocation } from 'lib/location'
import { Portal } from 'lib/portals'
import { isNotPlaying } from 'lib/utils/game'
import { itemNameXCount } from 'lib/utils/item-name-x-count'
import { createLogger } from 'lib/utils/logger'
import { Vec } from 'lib/vector'
import { WeakPlayerSet } from 'lib/weak-player-storage'
import { rtpCommand } from 'modules/commands/rtp'
import { tpMenuOnce } from 'modules/commands/tp'
import { Spawn } from 'modules/places/spawn'
import { showSurvivalHud } from 'modules/survival/sidebar'
import { AreaWithInventory } from '../lib/area-with-inventory'
import { RadioactiveZone } from './radioactive-zone'
import('./airdrop')

class AnarchyBuilder extends AreaWithInventory {
  portal: Portal | undefined

  zone: RadioactiveZone | undefined

  // Hook function
  async enterLearning(player: Player): Promise<boolean> {
    return Promise.resolve(true)
  }

  inventoryName: InventoryTypeName = 'anarchy'

  centerLocation = location(Spawn.group.place('anarchy center').name(noI18nShared`центр анархии`))

  portalLocation = location(Spawn.group.place('anarchy portal').name(noI18nShared`портал на анархию`))

  inventoryStore = new InventoryStore('anarchy')

  constructor() {
    super()

    this.centerLocation.onLoad.subscribe(centerLocation => {
      if (!centerLocation.firstLoad) return console.warn('Anarchy center changed, reload to update zone/radius command')

      this.zone = new RadioactiveZone(centerLocation, 2000)

      new Command('radius')
        .setDescription(i18n`Выдает радиус границы анархии сейчас`)
        .setGroup('public')
        .setPermissions('member')
        .executes(ctx => ctx.player.info(i18n`Радиус границы анархии сейчас: ${this.zone?.radius}`))
    })

    this.portalLocation.onLoad.subscribe(portalLocation => this.createPortal(portalLocation))
  }

  private createPortal(portalLocation: ValidLocation<Vector3>) {
    this.portal = new Portal('anarchy', ...Vec.around(portalLocation, 0, 1, 1), player => {
      if (isNotPlaying(player)) return tpMenuOnce(player)
      if (player.database.inv === this.inventoryName) {
        return player.fail(i18n.error`Вы уже находитесь на анархии! Если это не так, используйте ${rtpCommand}`)
      }

      if (!Portal.canTeleport(player)) return

      if (!player.database.survival.anarchy) {
        this.enterLearning(player).then(r => {
          if (!r) return
          this.switchInventory(player)
          showSurvivalHud(player)
        })
      } else {
        Portal.fadeScreen(player)

        player.teleport(player.database.survival.anarchy)
        delete player.database.survival.anarchy
        this.switchInventory(player)

        showSurvivalHud(player)
        Portal.showHudTitle(player, '§6> §cAnarchy §6<')

        EventSignal.emit(this.onPlayerEnter, { player })
        if (!this.playerEnteredAnarchy.has(player)) {
          EventSignal.emit(this.onPlayerFirstEnter, { player })
          this.playerEnteredAnarchy.add(player)
        }
      }
    })

    const command = this.portal.createCommand().setDescription(i18n`§bПеремещает на анархию`)

    command
      .overload('clearpos')
      .setDescription(
        i18n`Очищает сохраненную точку анархии. При перемещении на анархию вы будете выброшены в случайную точку`,
      )
      .executes(ctx => {
        delete ctx.player.database.survival.anarchy
        ctx.player.success(i18n`Успех! Теперь вы можете использовать ${command} для перемещения на случайную позицию.`)
      })
  }

  onPlayerEnter = new EventSignal<{ player: Player }>()

  // to prevent from triggering multiple times
  private playerEnteredAnarchy = new WeakPlayerSet({ removeOnLeave: true })

  onPlayerFirstEnter = new EventSignal<{ player: Player }>()

  private logger = createLogger('Anarchy')

  loadInventory(player: Player) {
    if (this.inventoryStore.has(player.id)) {
      this.logger.player(player).info`Loading saved inventory`
      InventoryStore.load({
        to: player,
        from: this.inventoryStore.get(player.id, { remove: true }),
      })
    } else {
      this.logger.player(player).info`Loading empty inventory`
      InventoryStore.load({ to: player, from: InventoryStore.emptyInventory })
    }

    if (player.getGameMode() === GameMode.Adventure) player.setGameMode(GameMode.Survival)
    player.database.inv = this.inventoryName
  }

  saveInventory: AreaWithInventory['saveInventory'] = player => {
    this.inventoryStore.saveFrom(player, {
      rewrite: true,
      keepInventory: false,
    })
    const inv = this.inventoryStore.get(player.id, { remove: false, fallback: InventoryStore.emptyInventory })

    this.logger.player(player).info`Saved inventory:\n${Object.entries(inv.slots)
      .map(([slot, item]) => ` §6${slot}§f ${itemNameXCount(item, undefined, undefined, consoleLang)}`)
      .join('\n')}`

    // Do not save location if on spawn
    if (Spawn.region?.area.isIn(player)) return
    player.database.survival.anarchy = {
      x: Math.round(player.location.x),
      z: Math.round(player.location.z),
      y: Math.round(player.location.y),
    }
  }
}

export const Anarchy = new AnarchyBuilder()

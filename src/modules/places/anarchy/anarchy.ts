import { GameMode, Player } from '@minecraft/server'
import { EventSignal, InventoryStore, Portal, ValidLocation, Vector, location, rawMessageToString } from 'lib'
import { Language } from 'lib/assets/lang'
import { isNotPlaying } from 'lib/game-utils'
import { itemNameXCount } from 'lib/shop/item-name-x-count'
import { t } from 'lib/text'
import { createLogger } from 'lib/utils/logger'
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

  async learningRTP(player: Player): Promise<void> {
    // Hook function
  }

  inventoryName: InventoryTypeName = 'anarchy'

  centerLocation = location(Spawn.group.point('anarchy center').name('центр анархии'))

  portalLocation = location(Spawn.group.point('anarchy portal').name('портал на анархию'))

  inventoryStore = new InventoryStore('anarchy')

  constructor() {
    super()

    this.centerLocation.onLoad.subscribe(centerLocation => {
      if (!centerLocation.firstLoad) return console.warn('Anarchy center changed, reload to update zone/radius command')

      this.zone = new RadioactiveZone(centerLocation, players => players.length * 500 + 3000)

      new Command('radius')
        .setDescription('Выдает радиус границы анархии сейчас')
        .setGroup('public')
        .setPermissions('member')
        .executes(ctx => ctx.player.info(t`Радиус границы анархии сейчас: ${this.zone?.lastRadius}`))
    })

    this.portalLocation.onLoad.subscribe(portalLocation => this.createPortal(portalLocation))
  }

  private createPortal(portalLocation: ValidLocation<Vector3>) {
    this.portal = new Portal('anarchy', ...Vector.around(portalLocation, 0, 1, 1), player => {
      if (isNotPlaying(player)) return tpMenuOnce(player)
      if (player.database.inv === this.inventoryName) {
        return player.fail(t.error`Вы уже находитесь на анархии! Если это не так, используйте ${rtpCommand}`)
      }

      if (!Portal.canTeleport(player)) return

      Portal.fadeScreen(player)
      this.switchInventory(player)

      if (!player.database.survival.anarchy) {
        this.learningRTP(player).then(() => {
          showSurvivalHud(player)
        })
      } else {
        player.teleport(player.database.survival.anarchy)
        delete player.database.survival.anarchy
        showSurvivalHud(player)
        Portal.showHudTitle(player, '§6> §cAnarchy §6<')
        EventSignal.emit(this.onPlayerEnter, { player })
      }
    })

    const command = this.portal.createCommand().setDescription('§bПеремещает на анархию')

    command
      .overload('clearpos')
      .setDescription(
        'Очищает сохраненную точку анархии. При перемещении на анархию вы будете выброшены в случайную точку',
      )
      .executes(ctx => {
        delete ctx.player.database.survival.anarchy
        ctx.player.success(t`Успех! Теперь вы можете использовать ${command} для перемещения на случайную позицию.`)
      })
  }

  onPlayerEnter = new EventSignal<{ player: Player }>()

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

    if (player.getGameMode() === GameMode.adventure) player.setGameMode(GameMode.survival)
    player.database.inv = this.inventoryName
  }

  saveInventory: AreaWithInventory['saveInventory'] = player => {
    this.inventoryStore.saveFrom(player, {
      rewrite: true,
      keepInventory: false,
    })
    const inv = this.inventoryStore.get(player.id, { remove: false, fallback: InventoryStore.emptyInventory })

    this.logger.player(player).info`Saved inventory:\n${Object.entries(inv.slots)
      .map(([slot, item]) => ` §6${slot}§f ${rawMessageToString(itemNameXCount(item), Language.ru_RU)}`)
      .join('\n')}`

    // Do not save location if on spawn
    if (Spawn.region?.area.isIn(player) || player.database.survival.doNotSaveAnarchy) return
    player.database.survival.anarchy = {
      x: Math.round(player.location.x),
      z: Math.round(player.location.z),
      y: Math.round(player.location.y),
    }
  }
}

export const Anarchy = new AnarchyBuilder()

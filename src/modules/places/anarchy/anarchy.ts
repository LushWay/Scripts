import { GameMode, Player } from '@minecraft/server'
import { InventoryStore, Portal, ValidLocation, Vector, location } from 'lib'
import { isNotPlaying } from 'lib/game-utils'
import { t } from 'lib/text'
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
        return player.fail(
          '§cВы уже находитесь на анархии! Если это не так, используйте §f.anarchy clearpos §cчтобы очистить позицию на анархии и §f.spawn§c для перемещения на спавн.',
        )
      }

      const title = Portal.canTeleport(player, { place: '§6> §cAnarchy §6<' })
      if (!title) return

      if (!player.database.survival.anarchy) {
        this.learningRTP(player).then(() => {
          this.switchInventory(player)
        })
      } else {
        this.switchInventory(player)

        player.teleport(player.database.survival.anarchy)
        delete player.database.survival.anarchy
      }

      showSurvivalHud(player)
      title()
    })

    this.portal.command
      ?.overload('clearpos')
      .setDescription(
        'Очищает сохраненную точку анархии. При перемещении на анархию вы будете выброшены в случайную точку',
      )
      .executes(ctx => {
        delete ctx.player.database.survival.anarchy
        ctx.player.success(
          '§fУспех!§7 Теперь вы можете использовать §f-anarchy§7 для перемещения на случайную позицию.',
        )
      })
  }

  loadInventory(player: Player) {
    if (this.inventoryStore.has(player.id)) {
      player.log('Anarchy', 'loading saved inventory')
      InventoryStore.load({
        to: player,
        from: this.inventoryStore.get(player.id, { remove: true }),
      })
    } else {
      player.log('Anarchy', 'loading empty inventory')
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

    player.log(
      'Anarchy',
      'saved inventory',
      Object.entries(inv.slots).map(e => `${e[0]} ${e[1].typeId}`),
    )

    // Do not save location if on spawn
    if (Spawn.region?.area.isVectorIn(player.location, player.dimension.type)) return
    player.database.survival.anarchy = {
      x: Math.round(player.location.x),
      z: Math.round(player.location.z),
      y: Math.round(player.location.y),
    }
  }
}

export const Anarchy = new AnarchyBuilder()

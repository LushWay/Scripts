import {
  EquipmentSlot,
  ItemStack,
  Player,
  Vector,
  system,
  world,
} from '@minecraft/server'
import {
  MinecraftBlockTypes,
  MinecraftEffectTypes,
  MinecraftItemTypes,
} from '@minecraft/vanilla-data.js'
import { EditableLocation, InventoryStore, util } from '../../../xapi.js'
import { MENU } from '../../Server/Menu/var.js'
import { JOIN } from '../../Server/PlayerJoin/var.js'
import { RadiusRegion, Region } from '../../Server/Region/Region.js'
import { loadRegionsWithGuards } from '../../Server/Region/index.js'
import { Zone } from '../Minigames/BattleRoyal/zone.js'
import './base.js'
import { BASE_ITEM_STACK } from './base.js'
import './bouncyTnt.js'
import './fireworks.js'
import { Portal } from './portals.js'
import './raid.js'
import { randomTeleport } from './rtp.js'

console.log('SURVIVAL LOADED')

loadRegionsWithGuards(
  // Common actions guard
  (player, region, context) => {
    if (region) {
      if (region.permissions.owners.includes(player.id)) return true
    } else {
      const heldItem = player
        .getComponent('equippable')
        .getEquipmentSlot(EquipmentSlot.Mainhand)
      if (heldItem?.isStackableWith(BASE_ITEM_STACK)) return true

      if (context.type === 'break' && player.isGamemode('adventure'))
        return true

      if (player.hasTag('modding')) return true
    }
  },

  // Spawn entity guard
  (region, data) =>
    !region ||
    region.permissions.allowedEntitys === 'all' ||
    region.permissions.allowedEntitys.includes(data.entity.typeId),

  (player, currentRegion) => {
    if (currentRegion && !currentRegion?.permissions.pvp) {
      player.triggerEvent('player:spawn')
    }
  }
)

Region.config.permissions = {
  allowedEntitys: 'all',
  doorsAndSwitches: false,
  openContainers: false,
  owners: [],
  pvp: true,
}

JOIN.CONFIG.title_animation = {
  stages: ['» $title «', '»  $title  «'],
  vars: {
    title: '§aShp1nat§6Mine§r§f',
  },
}
JOIN.CONFIG.subtitle = 'Добро пожаловать!'

for (const key of Object.keys(JOIN.EVENT_DEFAULTS)) {
  JOIN.EVENTS[key].unsubscribe(JOIN.EVENT_DEFAULTS[key])
}

JOIN.EVENTS.firstTime.subscribe(player => {
  player.getComponent('inventory').container.addItem(MENU.item)
})

export const SPAWN = {
  startAxeItem: new ItemStack(MinecraftItemTypes.WoodenAxe),
  /** @type {string[]} */
  startAxeCanBreak: Object.entries(MinecraftBlockTypes)
    .filter(e => e[0].match(/log/i))
    .map(e => e[1]),
  inventory: {
    xp: 0,
    health: 20,
    equipment: {},
    slots: [MENU.item],
  },
  location: new EditableLocation('spawn', {
    fallback: new Vector(0, 200, 0),
  }),
  /** @type {undefined | Region} */
  region: void 0,
}

SPAWN.startAxeItem.setCanDestroy(SPAWN.startAxeCanBreak)
SPAWN.startAxeItem.nameTag = 'Начальный топор'
SPAWN.startAxeItem.setLore(['§r§7Начальный топор'])

/**
 *
 * @param {Player} player
 */
function spawnInventory(player) {
  const data = player.database.survival

  if (data.inv === 'anarchy') {
    ANARCHY.inventory.saveFromEntity(player, {
      rewrite: false,
      keepInventory: false,
    })
    data.anarchy = Vector.floor(player.location)
  }

  if (data.inv !== 'spawn') {
    InventoryStore.load({ to: player, from: SPAWN.inventory })
    data.inv = 'spawn'
  }
}

if (SPAWN.location.valid) {
  new Portal('spawn', null, null, player => {
    if (!Portal.canTeleport(player)) return
    spawnInventory(player)

    player.teleport(SPAWN.location)
  })
  world.setDefaultSpawnLocation(SPAWN.location)
  SPAWN.region = Region.locationInRegion(SPAWN.location, 'overworld')
  if (!SPAWN.region || !(SPAWN.region instanceof RadiusRegion)) {
    SPAWN.region = new RadiusRegion(
      { x: SPAWN.location.x, z: SPAWN.location.z, y: SPAWN.location.y },
      200,
      'overworld',
      {
        doorsAndSwitches: false,
        openContainers: false,
        pvp: false,
        allowedEntitys: 'all',
        owners: [],
      }
    )
  }
  system.runPlayerInterval(
    player => {
      if (SPAWN.region && SPAWN.region.vectorInRegion(player.location)) {
        spawnInventory(player)

        player.addEffect(MinecraftEffectTypes.Saturation, 1, {
          amplifier: 255,
          showParticles: false,
        })
      }
    },
    'SpawnRegion',
    20
  )
}

export const ANARCHY = {
  centerLocation: new EditableLocation('anarchy_center'),
  portalLocation: new EditableLocation('anarchy'),
  inventory: new InventoryStore('anarchy'),
  /** @type {undefined | Portal} */
  portal: void 0,
}
if (ANARCHY.centerLocation.valid) {
  system.runInterval(
    () => {
      const players = world.getPlayers()
      const radius = players.length * 50

      const rmax = {
        x: ANARCHY.centerLocation.x + radius,
        y: 0,
        z: ANARCHY.centerLocation.z + radius,
      }

      const rmin = {
        x: ANARCHY.centerLocation.x - radius,
        y: 0,
        z: ANARCHY.centerLocation.z - radius,
      }

      for (const p of players) {
        const l = Vector.floor(p.location)
        if (
          l.x >= rmax.x &&
          l.x <= rmax.x + 10 &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.tp(p, true, rmax)

        if (
          l.x >= rmax.x - 10 &&
          l.x <= rmax.x &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.warn(p, true, rmax)

        if (
          l.z >= rmax.z &&
          l.z <= rmax.z + 10 &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.tp(p, false, rmax)

        if (
          l.z >= rmax.z - 10 &&
          l.z <= rmax.z &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.warn(p, false, rmax)

        if (
          l.x <= rmin.x &&
          l.x >= rmin.x - 10 &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.tp(p, true, rmin, true)

        if (
          l.x <= rmin.x + 10 &&
          l.x >= rmin.x &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.warn(p, true, rmin)

        if (
          l.z <= rmin.z &&
          l.z >= rmin.z - 10 &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.tp(p, false, rmin, true)

        if (
          l.z <= rmin.z + 10 &&
          l.z >= rmin.z &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.warn(p, false, rmin)

        // TODO detect if player in the zone
        // anarchyInventory(p, p.db());
      }
    },
    'zone',
    10
  )
}

/**
 *
 * @param {Player} player
 */
function anarchyInventory(player) {
  if (player.database.survival.inv !== 'anarchy') {
    if (player.id in ANARCHY.inventory._.STORES) {
      InventoryStore.load({
        to: player,
        from: ANARCHY.inventory.getEntityStore(player.id, true),
      })
      player.database.survival.inv = 'anarchy'
    }
  }
}

/**
 * @typedef {{anarchy?: Vector3, inv: "anarchy" | "spawn" | "mg"}} DB
 */

if (ANARCHY.portalLocation.valid) {
  ANARCHY.portal = new Portal(
    'anarchy',
    Vector.add(ANARCHY.portalLocation, { x: 0, y: -1, z: -1 }),
    Vector.add(ANARCHY.portalLocation, { x: 0, y: 1, z: 1 }),
    player => {
      if (!Portal.canTeleport(player)) return
      const data = player.database.survival

      if (data.inv === 'anarchy') {
        return player.tell('§cВы уже находитесь на анархии!')
      }

      system.run(() =>
        util.catch(() => {
          if (!data.anarchy || !(player.id in ANARCHY.inventory._.STORES)) {
            randomTeleport(
              player,
              { x: 500, y: 0, z: 500 },
              { x: 1500, y: 0, z: 1500 },
              {
                elytra: true,
                teleportCallback() {
                  player.tell('§a> §fВы были перемещены.')
                  player.playSound('note.pling')
                },
                keepInSkyTime: 20,
              }
            )

            InventoryStore.load({
              from: {
                equipment: {},
                health: 20,
                xp: 0,
                slots: [SPAWN.startAxeItem],
              },
              to: player,
              clearAll: true,
            })
            data.inv = 'anarchy'
          } else {
            anarchyInventory(player)

            player.teleport(data.anarchy)
            delete data.anarchy
          }
        })
      )
    }
  )
}

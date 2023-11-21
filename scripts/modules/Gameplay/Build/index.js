import { system, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data.js'
import { is } from 'smapi.js'
import { SYSTEM_ENTITIES } from '../../../config.js'
import { Region } from '../../Region/Region.js'
import { loadRegionsWithGuards } from '../../Region/index.js'
import { JOIN } from '../../Server/PlayerJoin/var.js'
import './menu.js'

const GLOBAL_ALLOWED_ENTITIES = ['minecraft:player', 'minecraft:item'].concat(
  SYSTEM_ENTITIES
)

loadRegionsWithGuards({
  allowed(player, region) {
    return (
      is(player.id, 'builder') || region?.permissions.owners.includes(player.id)
    )
  },

  spawnAllowed(region, data) {
    !region && GLOBAL_ALLOWED_ENTITIES.includes(data.entity.typeId)
  },
})

Region.config.SETTED = true
Region.config.permissions.allowedEntities = GLOBAL_ALLOWED_ENTITIES
JOIN.CONFIG.title_animation = {
  stages: ['» $title «', '»  $title  «'],
  vars: {
    title: '§b§aShp1nat§bBuild§r§f',
  },
}
JOIN.CONFIG.subtitle = 'Строим вместе!'

world.beforeEvents.explosion.subscribe(data => (data.cancel = true))

const EFFECT_Y = -55
const TP_Y = -63
const TP_TO = TP_Y + 5

system.runPlayerInterval(player => {
  const loc = player.location
  if (loc.y >= EFFECT_Y + 1) return
  if (loc.y < EFFECT_Y)
    player.addEffect(MinecraftEffectTypes.Levitation, 3, {
      amplifier: 7,
      showParticles: false,
    })

  if (loc.y < TP_Y) player.teleport({ x: loc.x, y: TP_TO, z: loc.z })
}, "Server.type::Build('underground effects')")

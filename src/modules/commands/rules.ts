/* i18n-ignore */

import { World, world } from '@minecraft/server'
import { form } from 'lib/form/new'

new Command('rules')
  .setDescription('Применяет целые наборы игровых правил')
  .setPermissions('techAdmin')
  .executes(ctx => f.show(ctx.player))

const f = form((form, { player }) => {
  form.title('GameRules')
  for (const [name, rules] of Object.entries(ruleSets)) {
    let color = ''
    if (Object.entries(rules).some(([k, v]) => world.gameRules[k as keyof Rules] !== v)) {
      color = '§7'
    }
    form.button(color + name, () => {
      player.success()
      Object.assign(world.gameRules, rules)
    })
  }
})

type Rules = Partial<World['gameRules']>

const base = {
  commandBlocksEnabled: false,
  spawnRadius: 0,
  keepInventory: false,
  showDaysPlayed: false,
  showTags: false,
  showRecipeMessages: true,
  recipesUnlock: true,
  naturalRegeneration: true,
  doDayLightCycle: false,
  doEntityDrops: true,
  doFireTick: false,
  doTileDrops: true,
} satisfies Rules

const ruleSets: Record<string, Omit<Rules, keyof typeof base>> = {
  'Безопасный\n§7Гриф отключен, тнт не взрывается': {
    mobGriefing: false,
    doMobLoot: false,
    tntExplodes: false,
    respawnBlocksExplode: false,
    doMobSpawning: false,
    showDeathMessages: true,
    doWeatherCycle: false,

    ...base,
  },
  'Релиз, анархия\n§7Все как надо для игры': {
    mobGriefing: true,
    doMobLoot: true,
    doMobSpawning: true,
    tntExplodes: true,
    respawnBlocksExplode: true,
    showDeathMessages: false,
    doWeatherCycle: true,

    ...base,
  },
}

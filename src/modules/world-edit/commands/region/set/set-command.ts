import { BlockPermutation } from '@minecraft/server'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { getReplaceMode } from 'modules/world-edit/utils/blocks-set'
import { blockIsAvaible } from './block-is-avaible'
import { setSelectionMenu } from './set-selection'

const set = new Command('set')
  .setDescription('Частично или полностью заполняет блоки в выделенной области')
  .setPermissions('builder')
set.string('block').executes((ctx, block) => {
  const we = WorldEdit.forPlayer(ctx.player)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')
  if (!blockIsAvaible(block, ctx.player)) return

  we.fillBetween([BlockPermutation.resolve(block)], [], getReplaceMode(''))
})
set.executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.player)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')
  ctx.reply('§b> §3Закрой чат!')
  setSelectionMenu(ctx.player)
})

import { BlockPermutation } from '@minecraft/server'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { getReplaceMode } from 'modules/world-edit/utils/blocks-set'
import { REPLACE_MODES } from 'modules/world-edit/utils/default-block-sets'
import { blockIsAvaible } from './block-is-avaible'
import { setSelectionMenu } from './set-selection'

const set = new Command('set')
  .setDescription('Частично или полностью заполняет блоки в выделенной области')
  .setPermissions('builder')
set
  .string('block')
  .array('mode', Object.keys(REPLACE_MODES), true)
  .string('replaceBlock')
  .executes((ctx, block, replaceMode = '', replaceBlock) => {
    const we = WorldEdit.forPlayer(ctx.player)
    if (!we.selection) return ctx.reply('§cЗона не выделена!')
    if (!blockIsAvaible(block, ctx.player)) return
    if (replaceBlock && !blockIsAvaible(replaceBlock, ctx.player)) return

    we.fillBetween(
      [BlockPermutation.resolve(block)],
      replaceBlock ? [BlockPermutation.resolve(replaceBlock)] : [],
      getReplaceMode(replaceMode),
    )
  })
set.executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.player)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')
  ctx.reply('§b> §3Закрой чат!')
  setSelectionMenu(ctx.player)
})

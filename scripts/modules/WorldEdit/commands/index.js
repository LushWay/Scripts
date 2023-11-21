const commands = [
  './general/desel.js',
  './general/drawsel.js',
  './general/id.js',
  './general/we.js',
  './general/item.js',
  './general/redo.js',
  './general/undo.js',

  './selection/chunk.js',
  './selection/expand.js',
  './selection/hpos1.js',
  './selection/hpos2.js',
  './selection/pos1.js',
  './selection/pos2.js',
  './selection/size.js',

  './region/set.js',

  './clipboard/copy.js',
  './clipboard/paste.js',

  '../tools/brush.js',
  '../tools/wand.js',
  '../tools/nylium.js',
  '../tools/shovel.js',
  '../tools/tool.js',
]

import importModules from '../../importModules.js'

importModules({
  array: commands,
  fn: module => import(module),
  strikeMessage: 'WorldEdit commands',
})

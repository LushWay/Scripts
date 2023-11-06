const commands = [
  './general/desel.js',
  './general/drawsel.js',
  './general/id.js',
  './general/menu.js',
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

import load from '../../../import.js'

load({
  array: commands,
  message: 'WorldEdit commands',
  fn: module => import(module),
  striketest: 0,
})

import importModules from 'modules/importModules.js'

importModules({
  array: [
    //
    'gamemode',
    'db',
    'help',
    'inv',
    'name',
    'ping',
    'role',
    'settings',
    'shell',
    'sit',
    'tp',
  ].map(e => `./${e}.js`),
  fn: m => import(m),
})

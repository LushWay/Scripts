import importModules from 'modules/importModules.js'

importModules({
  array: [
    'gamemode',
    'db',
    'help',
    'name',
    'ping',
    'role',
    'settings',
    'shell',
    'sit',
    'leaderboard',
    'scores',
    'tp',
  ].map(e => `./${e}.js`),
  fn: m => import(m),
})

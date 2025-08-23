import { system } from '@minecraft/server'

system.beforeEvents.startup.subscribe(() => {
  system.run(() => {
    if (__TEST__) import('./test/loader')
    else import('./modules/loader')
  })
})

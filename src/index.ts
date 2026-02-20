// Takes too much to load dynamically which results in interrupted error
import 'lib/assets/intl-global-object'
import 'lib/assets/intl'

import('./modules/loader').catch(e => {
  console.error('Loading error', e)
})

// system.beforeEvents.startup.subscribe(() => {
//   system.run(() => {
//     if (__TEST__) import('./test/loader')
//     else import('./modules/loader')
//   })
// })

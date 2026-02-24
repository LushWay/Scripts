// Takes too much to load dynamically which results in interrupted error
import 'lib/assets/intl-global-object'

import 'lib/assets/intl'

import('./modules/loader').catch((e: unknown) => {
  console.log('hello from autodeply')
  console.error('Loading error', e)
})

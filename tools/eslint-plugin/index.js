import exportBoundaries from './rules/export-boundaries.js'
import translate from './rules/translate.js'

export default {
  rules: {
    'tr': translate,
    'export-boundaries': exportBoundaries,
  },
}

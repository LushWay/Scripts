import { notice, patchPackage } from './patch-package.js'

// TODO Remove all patch scripts
patchPackage('@minecraft/server', {
  classes: {},
  replaces: [
    {
      // use name from the function name instead, make eslint rule for it
      find: 'runInterval(callback: () => void, tickInterval?: number): number;',
      replace: 'runInterval(callback: () => void, name: string, tickInterval?: number): number;',
    },
    {
      find: 'runTimeout(callback: () => void, tickDelay?: number): number;',
      replace: 'runTimeout(callback: () => void, name: string, tickDelay?: number): number;',
    },
  ],
  additions: {
    beginning: '',
    afterImports: notice,
    ending: notice,
  },
})


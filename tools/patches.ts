import { m, notice, patchPackage } from './patch-package.ts'

export type ________ = typeof import('@minecraft/server')

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
    {
      find: m` * @throws
     * Throws if the slot's container is invalid.
     *
     * {@link InvalidContainerSlotError}
     */
    readonly typeId: string;`,
      replace: `
     */
    readonly typeId?: string;`,
    },
  ],
  additions: {
    beginning: '',
    afterImports: notice,
    ending: notice,
  },
})

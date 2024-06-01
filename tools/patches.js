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
    {
      find: `/**
    * @remarks
    * Identifier of the type of items for the stack. If a
    * namespace is not specified, 'minecraft:' is assumed.
    * Examples include 'wheat' or 'apple'.
    *
    * @throws
    * Throws if the slot's container is invalid.
    *
    * {@link InvalidContainerSlotError}
    */
   readonly typeId: string;`,
      replace: `/**
   * @remarks
   * Identifier of the type of items for the stack. If a
   * namespace is not specified, 'minecraft:' is assumed.
   * Examples include 'wheat' or 'apple'.
   *
   * @throws
   * Throws if the slot's container is invalid.
   *
   * {@link InvalidContainerSlotError}
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

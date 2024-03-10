import { defineGitDependency } from 'leafy-utils'

defineGitDependency({
  remote: {
    url: 'https://github.com/Herobrine643928/Chest-UI',
    branch: 'additional-features',
    path: 'Without Inventory/BP/scripts/',
  },
  path: 'scripts/',
  dependencies: {
    // 'extensions/typeIds.js': { localPath: 'lib/list/item-aux-ids.js', file: true },
    extensions: 'chestui',
  },
})

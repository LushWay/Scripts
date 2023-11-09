// @ts-check
import { defineGitDependency } from 'leafy-utils'

export default defineGitDependency({
  remote: {
    url: 'https://github.com/Herobrine643928/Chest-UI',
    branch: 'main',
    path: 'BP/scripts/',
  },
  path: 'scripts/',
  dependencies: {
    extensions: 'chestui',
  },
})

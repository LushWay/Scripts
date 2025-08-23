import { PackageJSON, writeJSON } from 'leafy-utils'
import path from 'path'
import { logger } from './logger.ts'

export async function generateManifestJson({ world, outfile, outdir }: import('./esbuild.ts').BuildArgs) {
  const packagejson = new PackageJSON()
  await packagejson.init()
  const dependencies = Object.entries(packagejson.content.dependencies)
    .map(([name, version]) => {
      const match = (version as string).match(/\d+\.\d+\.\d+-(?:beta|stable)/)

      if (!match && name !== '@minecraft/vanilla-data' && name !== 'async-mutex' && !name.startsWith('@formatjs')) {
        logger.warn(
          "Version of the package '" +
            name +
            "' does not matches 0.0.0-(beta|stable) pattern, skipping insterting into manifest.json...",
        )
      }

      return [name, match?.[0] ?? '']
    })
    .filter(e => !!e[1])

  if (!Object.entries(packagejson.content.resolutions).every(([k, v]) => packagejson.content.dependencies[k] === v)) {
    packagejson.content.resolutions = packagejson.content.dependencies
    await packagejson.write()
  }

  const base = {
    format_version: 2,
    header: {
      name: 'LushWayScripts',
      description: 'Server Plugin',
      uuid: '8198b306-bfbb-48c9-874d-217cd4cef1ae',
      version: [3, 0, 4],
      min_engine_version: [1, 20, 50],
    },
    modules: [
      {
        description: 'Behavior Packs Module',
        type: 'data',
        uuid: '786cb1e6-e840-40d7-a986-9fb9e348634a',
        version: [0, 0, 0],
      },
      {
        description: 'ScriptAPI Module',
        language: 'javascript',
        type: 'script',
        uuid: '4f6a99e0-c4a2-4172-8818-c753d5cdab1f',
        version: [0, 0, 0],
        entry: path.join('scripts', outfile.replace(outdir, '')).replaceAll(path.sep, '/'),
      },
    ],
    dependencies: [
      {
        module_name: 'name',
        version: 'version',
      },
    ],
    capabilities: [],
  }

  base.dependencies = dependencies
    // server-net is not available on world
    .filter(e => !(world && e[0] === '@minecraft/server-net'))
    .map(e => ({
      module_name: e[0],
      version: e[1],
    }))

  await writeJSON(path.join(outdir, '../manifest.json'), base).catch(e =>
    logger.error('Failed writing manifest.json file:', e),
  )
}

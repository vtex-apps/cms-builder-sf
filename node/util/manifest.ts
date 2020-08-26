import { readJson } from 'fs-extra'

import InvalidDependency from '../errors/invalidDependency'
import InvalidManifest from '../errors/invalidManifest'
import { UploadFile } from './uploadFile'

export interface Manifest {
  name: string
  vendor: string
  version: string
  builders: {
    [key: string]: string
  }
  dependencies: {
    [key: string]: string
  }
}

export function getAppId(manifest: Manifest): string {
  return `${manifest.vendor}.${manifest.name}@${manifest.version}`
}

export function makeEmptyManifest() {
  const dependencies = defaultDependencies()
  const builders = { store: '0.x' }
  const manifest: Manifest = {
    builders,
    dependencies,
    name: '',
    vendor: '',
    version: '',
  }

  return manifest
}

export function defaultDependencies() {
  const dependencies: { [key: string]: string } = {
    'vtex.store': '2.x',
  }

  return dependencies
}

export function validateManifest(manifest: Manifest): void {
  const vendorRegex = new RegExp(/^[\w_-]+$/)
  const nameRegex = new RegExp(/^[\w_-]+$/)
  const versionRegex = new RegExp(/^\d+\.\d+\.\d+(-.*)?$/)

  if (manifest.name === undefined) {
    throw new InvalidManifest(
      'Field "name" should be set in manifest.json file.'
    )
  }

  if (manifest.version === undefined) {
    throw new InvalidManifest(
      'Field "version" should be set in manifest.json file.'
    )
  }

  if (manifest.vendor === undefined) {
    throw new InvalidManifest(
      'Field "vendor" should be set in manifest.json file.'
    )
  }

  if (!nameRegex.test(manifest.name)) {
    throw new InvalidManifest(
      'Field "name" may contain only letters, numbers, underscores and hyphens.'
    )
  }

  if (!vendorRegex.test(manifest.vendor)) {
    throw new InvalidManifest(
      'Field "vendor" may contain only letters, numbers, underscores and hyphens.'
    )
  }

  if (!versionRegex.test(manifest.version)) {
    throw new InvalidManifest('The version format is invalid.')
  }
}

export async function parseManifest(codePath: string): Promise<Manifest> {
  const manifestPath = `${codePath}/manifest.json`

  let manifest

  try {
    const readjson = await readJson(manifestPath)

    manifest = readjson as Manifest
  } catch (error) {
    console.error(error)

    throw new InvalidManifest('manifest.json does not exist or is malformed.')
  }

  validateManifest(manifest)

  return manifest
}

export async function makeDefaultManifest(
  name: string,
  version: string,
  vendor: string
) {
  const dependencies = defaultDependencies()
  const builders = { store: '0.x' }
  const manifest: Manifest = { name, version, vendor, builders, dependencies }

  validateManifest(manifest)

  return manifest
}

export function updateManifest(
  manifest: Manifest,
  uploadFile: UploadFile,
  version: string
) {
  manifest.version = version
  manifest.dependencies = updateDependencies(manifest.dependencies, uploadFile)

  return manifest
}

function updateDependencies(
  dependencies: { [key: string]: string },
  uploadFile: UploadFile
) {
  for (const element of uploadFile.dependencies) {
    const [depAndVar] = element.split(':')
    const [dependency, version] = depAndVar.split('@')

    if (!version) {
      throw new InvalidDependency(
        'The dependencies must be in the format: dependency.name@version:other.information'
      )
    }

    dependencies[dependency] = version
  }

  return dependencies
}

import {readJson} from 'fs-extra'
import InvalidManifest from '../errors/invalidManifest'

export interface Manifest {
  name: string
  vendor: string
  version: string
  builders: {
    [key: string]: string,
  }
  dependencies: {
    [key: string]: string,
  }
}

export function getAppId (manifest: Manifest): string {
  return `${manifest.vendor}.${manifest.name}@${manifest.version}`
}

export function makeEmptyManifest(){
  const dependencies = defaultDependencies()
  const builders = {'store': '0.x'}
  const manifest: Manifest = {name: '', vendor: '', version: '', builders, dependencies}
  return manifest
}

export function defaultDependencies () {
  const dependencies: {[key: string]: string} = {'vtex.store': '2.x',
  'vtex.store-header': '2.x',
  // tslint:disable-next-line:object-literal-sort-keys
  'vtex.product-summary': '2.x',
  'vtex.store-footer': '2.x',
  'vtex.store-components': '3.x',
  'vtex.styleguide': '9.x',
  'vtex.slider': '0.x',
  'vtex.carousel': '2.x',
  'vtex.shelf': '1.x',
  'vtex.menu': '2.x',
  'vtex.minicart': '2.x',
  'vtex.product-details': '1.x',
  'vtex.product-kit': '1.x',
  'vtex.search-result': '3.x',
  'vtex.login': '2.x',
  'vtex.my-account': '1.x',
  'vtex.flex-layout': '0.x',
  'vtex.rich-text': '0.x',
  'vtex.store-drawer': '0.x',
  'vtex.locale-switcher': '0.x',
  'vtex.product-quantity': '1.x',
  'vtex.product-identifier': '0.x',
  'vtex.breadcrumb': '1.x',
  'vtex.sticky-layout': '0.x',
  'vtex.product-customizer': '2.x',
  'vtex.stack-layout': '0.x',
  'vtex.product-specification-badges': '0.x',
  'vtex.product-review-interfaces': '1.x',
  'vtex.reviews-and-ratings': '1.x',
  'vtex.telemarketing': '2.x',
  'vtex.order-placed': '1.x',
  'vtex.checkout-summary': '0.x',
  'vtex.product-list': '0.x',
  'vtex.add-to-cart-button': '0.x',
  'vtex.product-bookmark-interfaces': '1.x',
  'vtex.slider-layout': '0.x',
  'vtex.store-image': '0.x',
  'vtex.store-icons': '0.x',
  'vtex.modal-layout': '0.x',
  'vtex.store-link': '0.x',
  'vtex.product-gifts': '0.x',
  'vtex.product-price': '1.x'}

  return dependencies
}

export function validateManifest (manifest: Manifest): void {
  const vendorRegex = new RegExp(`^[\\w_-]+$`)
  const nameRegex = new RegExp(`^[\\w_-]+$`)
  const versionRegex = new RegExp(`^\\d+\\.\\d+\\.\\d+(-.*)?$`)

  if (manifest.name === undefined) {
    throw new InvalidManifest('Field \'name\' should be set in manifest.json file.')
  }
  if (manifest.version === undefined) {
    throw new InvalidManifest('Field \'version\' should be set in manifest.json file.')
  }
  if (manifest.vendor === undefined) {
    throw new InvalidManifest('Field \'vendor\' should be set in manifest.json file.')
  }

  if (!nameRegex.test(manifest.name)) {
    throw new InvalidManifest('Field \'name\' may contain only letters, numbers, underscores and hyphens.')
  }
  if (!vendorRegex.test(manifest.vendor)) {
    throw new InvalidManifest('Field \'vendor\' may contain only letters, numbers, underscores and hyphens.')
  }
  if (!versionRegex.test(manifest.version)) {
    throw new InvalidManifest('The version format is invalid.')
  }
}

export async function parseManifest (codePath: string): Promise<Manifest> {
  const manifestPath = `${codePath}/manifest.json`

  let manifest
  try {
    const readjson = await readJson(manifestPath)
    manifest = readjson as Manifest
  } catch (error) {
    console.log(error)
    throw new InvalidManifest('manifest.json doesn\'t exist or is malformed.')
  }

  validateManifest(manifest)
  return manifest
}

export async function makeDefaultManifest(name: string, version: string, vendor: string){
  const dependencies = defaultDependencies()
  const builders = {'store': '0.x'}
  const manifest: Manifest = {name, version, vendor, builders, dependencies}

  validateManifest(manifest)
  return manifest
}

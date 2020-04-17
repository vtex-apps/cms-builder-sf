import { File } from '@vtex/api/lib/clients/infra/Registry'
import { json } from 'co-body'
import { writeJSON } from 'fs-extra'
import { createBaseFolder, parseJSON } from '../util/parseJSONZAO'

const version = '0.0.4'

async function makeManifest(path: string, account: string) {
  const manifestFile = '{"vendor": "' + account + '", "name": "auto-generated-store", "version": "' + version + '", "builders": {"store": "0.x"}, "dependencies": {"vtex.store": "2.x","vtex.store-header": "2.x","vtex.product-summary": "2.x","vtex.store-footer": "2.x","vtex.store-components": "3.x","vtex.styleguide": "9.x","vtex.slider": "0.x","vtex.carousel": "2.x","vtex.shelf": "1.x","vtex.menu": "2.x","vtex.minicart": "2.x","vtex.product-details": "1.x","vtex.product-kit": "1.x","vtex.search-result": "3.x","vtex.login": "2.x","vtex.my-account": "1.x","vtex.flex-layout": "0.x","vtex.rich-text": "0.x","vtex.store-drawer": "0.x","vtex.locale-switcher": "0.x","vtex.product-quantity": "1.x","vtex.product-identifier": "0.x","vtex.breadcrumb": "1.x","vtex.sticky-layout": "0.x","vtex.product-customizer": "2.x","vtex.stack-layout": "0.x","vtex.product-specification-badges": "0.x","vtex.product-review-interfaces": "1.x","vtex.reviews-and-ratings": "1.x","vtex.telemarketing": "2.x","vtex.order-placed": "1.x","vtex.checkout-summary": "0.x","vtex.product-list": "0.x","vtex.add-to-cart-button": "0.x","vtex.product-bookmark-interfaces": "1.x","vtex.slider-layout": "0.x","vtex.store-image": "0.x","vtex.store-icons": "0.x","vtex.modal-layout": "0.x","vtex.store-link": "0.x","vtex.product-gifts": "0.x","vtex.product-price": "1.x"}}'
  const manifestPath = path + '/' + 'manifest.json'
  await writeJSON(manifestPath, manifestFile)
  const manifest: File = { path: 'manifest.json', content: manifestFile}
  return manifest
}

export async function publishStore(ctx: Context, next: () => Promise<any>){
  if (ctx.method.toUpperCase() === 'GET') {
    console.log('Using the get method')
  }
  else if (ctx.method.toUpperCase() === 'POST' || ctx.method.toUpperCase() === 'PUT') {
    console.log('Using the post method')
    const body = await json(ctx.req)
    let path = 'autogen-store'
    path = await createBaseFolder(path, ctx.vtex.account, ctx.vtex.workspace)
    const files = await parseJSON(body, path+'/store', path)
    files.push(await makeManifest(path, ctx.vtex.account))
    const appName = ctx.vtex.account + '.auto-generated-store@' + version

    const publishedApp = await ctx.clients.builder.publishApp(appName, files)
    console.log('Build result message:', publishedApp.message)

  }
  else {
    ctx.status = 405
    ctx.body = 'Method not allow'
    return
  }

  ctx.status = 200
  ctx.body = 'Deu certo :D'

  await next()
}

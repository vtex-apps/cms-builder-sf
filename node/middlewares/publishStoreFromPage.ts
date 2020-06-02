import { File } from '@vtex/api/lib/clients/infra/Registry'
import { json } from 'co-body'

import { createBaseFolderWithStore } from '../util/extractFiles'
import { makeRoutes, UploadFile } from '../util/uploadFile'
import { makeManifest, version } from './publishStore'

const storeState = 'store-state-test'

export async function publishStoreFromPage(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const uploadFile: UploadFile = {name: `${body.meta.title}.json`, file: JSON.stringify(body.blocks), path: ''}

  const path = await createBaseFolderWithStore(storeState, ctx.vtex.account, ctx.vtex.workspace)
  const manifest = await makeManifest(path, storeState, ctx.vtex.account, version)
  const page: File = { path: `store/blocks/${uploadFile.name}`, content: uploadFile.file }
  const routesContent = makeRoutes(body.meta.page, body.meta.slug)
  const routes: File = {path: `store/routes.json`, content: routesContent}
  const files = [manifest, page, routes]

  const appName = `${ctx.vtex.account}.${storeState}@${version}`

  const publishedApp = await ctx.clients.builder.publishApp(appName, files)
  logger.info(`Build result message: ${publishedApp.message}`)
  logger.info(
    `Finished building ${appName}. Please check to make sure the publishing was successful.`
  )

  ctx.status = 200
  ctx.body = 'Deu certo :D'

  await next()
}

import { File } from '@vtex/api/lib/clients/infra/Registry'
import { json } from 'co-body'

import { createBaseFolderWithStore } from '../util/extractFiles'
import { makeRoutes, UploadFile } from '../util/uploadFile'
import { bumpPatchVersion } from '../util/versionControl'
import { makeManifest } from './publishStore'

const storeState = 'store-state'

export async function publishStoreFromPage(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const uploadFile: UploadFile = {
    file: JSON.stringify(body.blocks),
    name: `${body.meta.title}.json`,
    path: '',
  }

  const versions = await ctx.clients.registry.listVersionsByApp(`${ctx.vtex.account}.${storeState}`).catch(() => {
    logger.warn(`Could not find previous versions of ${storeState}`)
  })

  const appName = `${ctx.vtex.account}.${storeState}`
  let appID = `${appName}@0.0.0`
  if( versions ) {
    const index = versions.data.length - 1
    appID = versions.data[index].versionIdentifier
  }
  const newAppID = bumpPatchVersion(appID)
  const version = newAppID.split('@')[1]

  const path = await createBaseFolderWithStore(
    storeState,
    ctx.vtex.account,
    ctx.vtex.workspace
  )
  const manifest = await makeManifest(
    path,
    storeState,
    ctx.vtex.account,
    version
  )
  const page: File = {
    content: uploadFile.file,
    path: `store/blocks/${uploadFile.name}`,
  }
  const routesContent = makeRoutes(body.meta.page, body.meta.slug)
  const routes: File = { path: `store/routes.json`, content: routesContent }
  const files = [manifest, page, routes]


  const publishedApp = await ctx.clients.builder.publishApp(newAppID, files)
  logger.info(`Build result message: ${publishedApp.message}`)
  logger.info(
    `Finished building ${newAppID}. Please check to make sure the publishing was successful.`
  )

  ctx.status = 204

  await next()
}

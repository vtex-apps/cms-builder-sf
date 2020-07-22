import { File } from '@vtex/api/lib/clients/infra/Registry'
import { json } from 'co-body'
import { STORE_STATE } from './../util/constants'

import { parseAppId } from '@vtex/api'
import { createBaseFolderWithStore } from '../util/extractFiles'
import { makeDefaultManifest } from '../util/manifest'
import { makeRoutes, UploadFile } from '../util/uploadFile'
import { bumpPatchVersion } from '../util/versionControl'

const jsonResponse = (newAppID: string) => `{"appID": "${newAppID}"}`

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

  const appName = `${ctx.vtex.account}.${STORE_STATE}`
  let appID = `${appName}@0.0.0`
  try {
    const versions = await ctx.clients.registry.listVersionsByApp(`${ctx.vtex.account}.${STORE_STATE}`)
    const index = versions.data.length - 1
    appID = versions.data[index].versionIdentifier
  } catch(err) {
    logger.warn(`Could not find previous versions of ${STORE_STATE}`)
  }

  const newAppID = bumpPatchVersion(appID)
  const { version } = parseAppId(newAppID)

  await createBaseFolderWithStore(
    STORE_STATE,
    ctx.vtex.account,
    ctx.vtex.workspace
  )
  const manifest = await makeDefaultManifest(
    STORE_STATE,
    version,
    ctx.vtex.account
  )
  const page: File = {
    content: uploadFile.file,
    path: `store/blocks/${uploadFile.name}`,
  }
  const routesContent = makeRoutes(body.meta.page, body.meta.slug)
  const manifestFile: File = {path: 'manifest.json', content: JSON.stringify(manifest)}
  const routes: File = { path: `store/routes.json`, content: routesContent }
  const files = [manifestFile, page, routes]


  const publishedApp = await ctx.clients.builder.publishApp(newAppID, files)
  logger.info(`Build result message: ${publishedApp.message}`)
  logger.info(
    `Finished building ${newAppID}. Please check to make sure the publishing was successful.`
  )

  const response = jsonResponse(newAppID)

  ctx.status = 200
  ctx.body = response

  await next()
}

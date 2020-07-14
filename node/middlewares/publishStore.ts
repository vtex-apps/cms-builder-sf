import { File } from '@vtex/api/lib/clients/infra/Registry'
import { json } from 'co-body'

import { createBaseFolderWithStore, extractFiles } from '../util/extractFiles'
import { makeDefaultManifest } from '../util/manifest'

export const version = '0.0.12'
const storeState = 'store-state'

export async function publishStore(ctx: Context, next: () => Promise<any>) {

  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const path = await createBaseFolderWithStore(
    storeState,
    ctx.vtex.account,
    ctx.vtex.workspace
  )
  const files = await extractFiles(body, `${path}/store`, path)
  const manifest = await makeDefaultManifest(storeState, version, ctx.vtex.account)
  const manifestFile: File = {path: 'manifest.json', content: JSON.stringify(manifest)}
  files.push(manifestFile)
  console.log({manifestFile})

  const appName = `${ctx.vtex.account}.${storeState}@${version}`

  const publishedApp = await ctx.clients.builder.publishApp(appName, files)
  logger.info(`Build result message: ${publishedApp.message}`)
  logger.info(
    `Finished building ${appName}. Please check to make sure the publishing was successful.`
  )

  ctx.status = 204

  await next()
}

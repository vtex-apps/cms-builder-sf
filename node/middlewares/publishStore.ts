import { File } from '@vtex/api/lib/clients/infra/Registry'
import { json } from 'co-body'

import { STORE_STATE } from '../util/constants'
import { createBaseFolderWithStore, extractFiles } from '../util/extractFiles'
import { makeDefaultManifest } from '../util/manifest'

export const version = '0.0.12'

export async function publishStore(ctx: Context, next: () => Promise<any>) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const path = await createBaseFolderWithStore(
    STORE_STATE,
    ctx.vtex.account,
    ctx.vtex.workspace
  )

  const files = await extractFiles(body, `${path}/store`, path)
  const manifest = await makeDefaultManifest(
    STORE_STATE,
    version,
    ctx.vtex.account
  )

  const manifestFile: File = {
    path: 'manifest.json',
    content: JSON.stringify(manifest),
  }

  files.push(manifestFile)

  const appName = `${ctx.vtex.account}.${STORE_STATE}@${version}`

  const publishedApp = await ctx.clients.builder.publishApp(appName, files)

  logger.info(`Build result message: ${publishedApp.message}`)
  logger.info(
    `Finished building ${appName}. Please check to make sure the publishing was successful.`
  )

  ctx.status = 204

  await next()
}

import {
  extractVersionFromAppId,
  removeVersionFromAppId,
} from '@vtex/api'
import { json } from 'co-body'
import { ensureDir } from 'fs-extra'

import { uploadAndExtractFiles, UploadFile } from '../util/uploadFile'
import { version } from './publishStore'

const storeState = 'store-state'

export async function publishStoreFromPage(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const uploadFile: UploadFile = {name: `${body.title}.json`, file: body.blocks, path: ''}

  const appName = `${ctx.vtex.account}.${storeState}@0.0.2`
  const filePath = 'test'
  await ensureDir(filePath)

  const appVersion = extractVersionFromAppId(appName)
  const app = removeVersionFromAppId(appName)
  await ctx.clients.registry.unpackAppBundle(
    app,
    appVersion,
    '',
    filePath,
    false
  )

  const sourceCodePath = `${filePath}/src`
  const files = await uploadAndExtractFiles(uploadFile, sourceCodePath, sourceCodePath)
  const newAppName = `${ctx.vtex.account}.${storeState}@${version}`

  const publishedApp = await ctx.clients.builder.publishApp(newAppName, files)
  logger.info(publishedApp)

  ctx.status = 200
  ctx.body = 'Deu certo :D'

  await next()
}

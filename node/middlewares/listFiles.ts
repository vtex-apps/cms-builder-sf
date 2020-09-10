import { parseAppId } from '@vtex/api'
import { ensureDir } from 'fs-extra'
import streamToPromise from 'stream-to-promise'

import { STORE_STATE } from '../util/constants'
import { extractFiles } from '../util/appFiles'
// import { getRouteJSON } from './routes'

export async function listFiles(ctx: Context, next: () => Promise<any>) {
  const { logger } = ctx.vtex
  const appName = `${ctx.vtex.account}.${STORE_STATE}`
  let appID = `${appName}@0.0.0`
  let response = {
    routes: {},
    appFiles: {},
    manifest: {},
  }

  try {
    const versions = await ctx.clients.registry.listVersionsByApp(
      `${ctx.vtex.account}.${STORE_STATE}`
    )

    const index = versions.data.length - 1

    appID = versions.data[index].versionIdentifier
  } catch (err) {
    logger.warn(`Could not find previous versions of ${STORE_STATE}`)
    console.info(`Could not find previous versions of ${STORE_STATE}`)

    ctx.status = 200
    ctx.body = response

    await next()
  }

  const filePath = 'appFilesFromRegistry'

  await ensureDir(filePath)
  const oldVersion = parseAppId(appID).version
  const stream = await ctx.clients.registry.unpackAppBundle(
    appName,
    oldVersion,
    '',
    filePath,
    false
  )

  await streamToPromise(stream)
  const sourceCodePath = `${filePath}/src`

  const appFiles = await extractFiles(sourceCodePath, sourceCodePath)

  response = {
    routes: appFiles.routes,
    appFiles: appFiles.files,
    manifest: appFiles.manifest,
  }

  ctx.status = 200
  ctx.body = response

  await next()
}

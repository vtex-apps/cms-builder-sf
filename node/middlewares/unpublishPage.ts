import { json } from 'co-body'
import streamToPromise from 'stream-to-promise'
import { parseAppId } from '@vtex/api'
import { ensureDir } from 'fs-extra'

import { STORE_STATE } from '../util/constants'
import { returnResponseError } from '../errors/responseError'
import {
  extractFilesAndRemovePage,
  getFilesForBuilderHub,
} from '../util/appFiles'
import { bumpPatchVersion } from '../util/versionControl'

const jsonResponse = (newAppId: string) => `{"buildId": "${newAppId}"}`

export async function unpublishPage(ctx: Context, next: () => Promise<any>) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const pageToRemove = body.page

  const appName = `${ctx.vtex.account}.${STORE_STATE}`
  let appId = `${appName}@0.0.0`

  try {
    const versions = await ctx.clients.registry.listVersionsByApp(
      `${ctx.vtex.account}.${STORE_STATE}`
    )

    const index = versions.data.length - 1

    appId = versions.data[index].versionIdentifier
  } catch (err) {
    const errorResponse = `Could not find previous versions of ${STORE_STATE}`

    logger.error(errorResponse)
    ctx.status = 404
    ctx.body = errorResponse

    await next()
  }

  const newAppId = bumpPatchVersion(appId)
  const { version } = parseAppId(newAppId)

  const filePath = 'appFilesFromRegistry'

  await ensureDir(filePath)
  const oldVersion = parseAppId(appId).version
  const stream = await ctx.clients.registry.unpackAppBundle(
    appName,
    oldVersion,
    '',
    filePath,
    false
  )

  await streamToPromise(stream)
  const sourceCodePath = `${filePath}/src`

  let appFiles

  try {
    appFiles = await extractFilesAndRemovePage({
      pageToRemove,
      path: sourceCodePath,
      mainPath: sourceCodePath,
      version,
    })
  } catch (err) {
    return returnResponseError({
      message: 'Could not find a page to delete',
      code: 'PAGE_NOT_FOUND',
      ctx,
      next,
    })
  }

  const files = getFilesForBuilderHub(appFiles)

  const publishedApp = await ctx.clients.builder.publishApp(newAppId, files)

  logger.info(`Build result message: ${publishedApp.message}`)
  logger.info(
    `Finished building ${newAppId}. Please check to make sure the publishing was successful.`
  )

  const response = jsonResponse(newAppId)

  ctx.status = 200
  ctx.body = response

  await next()
}

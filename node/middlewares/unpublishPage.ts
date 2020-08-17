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

const jsonResponse = (newAppID: string) => `{"buildId": "${newAppID}"}`

export async function unpublishPage(ctx: Context, next: () => Promise<any>) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const pageToDelete = body.page

  const appName = `${ctx.vtex.account}.${STORE_STATE}`
  let appID = `${appName}@0.0.0`

  try {
    const versions = await ctx.clients.registry.listVersionsByApp(
      `${ctx.vtex.account}.${STORE_STATE}`
    )

    const index = versions.data.length - 1

    appID = versions.data[index].versionIdentifier
  } catch (err) {
    const errorResponse = `Could not find previous versions of ${STORE_STATE}`

    logger.error(errorResponse)
    ctx.status = 404
    ctx.body = errorResponse

    await next()
  }

  const newAppID = bumpPatchVersion(appID)
  const { version } = parseAppId(newAppID)

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

  let appFiles

  try {
    appFiles = await extractFilesAndRemovePage(
      pageToDelete,
      sourceCodePath,
      sourceCodePath,
      version
    )
  } catch (err) {
    return returnResponseError({
      message: 'Could not find page to delete',
      code: 'PAGE_NOT_FOUND',
      ctx,
      next,
    })
  }

  const files = getFilesForBuilderHub(appFiles)

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

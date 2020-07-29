import { json } from 'co-body'
import { STORE_STATE } from './../util/constants'

import { parseAppId } from '@vtex/api'
import { createNewAppFiles, getFilesForBuilderHub } from '../util/appFiles'
import { UploadFile } from '../util/uploadFile'
import { bumpPatchVersion } from '../util/versionControl'

const jsonResponse = (newAppID: string) => `{"buildId": "${newAppID}"}`

export async function publishStoreFromPage(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const uploadFile: UploadFile = {
    file: JSON.stringify(body.blocks),
    page: body.meta.page,
    slug: body.meta.slug,
    title: body.meta.title,
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

  const appFiles = await createNewAppFiles(uploadFile, version, ctx.vtex.account)
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

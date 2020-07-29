import { json } from 'co-body'
import { STORE_STATE } from './../util/constants'

import { parseAppId } from '@vtex/api'
import { ensureDir } from 'fs-extra'
import { createNewAppFiles, extractFilesAndUpdate, getFilesForBuilderHub } from '../util/appFiles'
import { UploadFile } from '../util/uploadFile'
import { bumpPatchVersion } from '../util/versionControl'

const jsonResponse = (newAppID: string) => `{"buildId": "${newAppID}"}`

export async function publishStoreFromPage(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  let newApp = false
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
    newApp = true
  }

  const newAppID = bumpPatchVersion(appID)
  const { version } = parseAppId(newAppID)

  let appFiles
  if(newApp === true){
    appFiles = await createNewAppFiles(uploadFile, version, ctx.vtex.account)
  } else {
    const filePath = 'appFilesFromRegistry'
    await ensureDir(filePath)
    const oldVersion = parseAppId(appID).version
    await ctx.clients.registry.unpackAppBundle(
      appName,
      oldVersion,
      '',
      filePath,
      false
    )
    const sourceCodePath = `${filePath}/src`
    appFiles = await extractFilesAndUpdate(uploadFile, sourceCodePath, sourceCodePath, version)
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

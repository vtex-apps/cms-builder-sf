import { parseAppId } from '@vtex/api'

import { createEmptyAppFiles, getFilesForBuilderHub } from '../util/appFiles'
import { STORE_STATE } from '../util/constants'
import { bumpPatchVersion } from '../util/versionControl'

const jsonResponse = (newAppId: string) => `{"buildId": "${newAppId}"}`

export async function emptyApp(ctx: Context, next: () => Promise<any>) {
  const { logger } = ctx.vtex

  const appName = `${ctx.vtex.account}.${STORE_STATE}`
  let appId = `${appName}@0.0.0`

  try {
    const versions = await ctx.clients.registry.listVersionsByApp(
      `${ctx.vtex.account}.${STORE_STATE}`
    )

    const index = versions.data.length - 1

    appId = versions.data[index].versionIdentifier
  } catch (err) {
    logger.warn(`Could not find previous versions of ${STORE_STATE}`)
  }

  const newAppId = bumpPatchVersion(appId)
  const { version } = parseAppId(newAppId)

  const appFiles = await createEmptyAppFiles(version, ctx.vtex.account)
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

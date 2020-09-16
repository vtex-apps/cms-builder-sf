import { createHash, randomBytes } from 'crypto'

import { parseAppId } from '@vtex/api'

import { BuildStatus } from '../events/buildStatus'
import { createEmptyAppFiles, getFilesForBuilderHub } from '../util/appFiles'
import { STORE_STATE } from '../util/constants'
import { saveBuildStatus } from '../util/vbase'
import { bumpPatchVersion } from '../util/versionControl'

const jsonResponse = (newAppID: string) => `{"buildId": "${newAppID}"}`

export async function emptyApp(ctx: Context, next: () => Promise<any>) {
  const { logger } = ctx.vtex

  const appName = `${ctx.vtex.account}.${STORE_STATE}`
  let appID = `${appName}@0.0.0`

  try {
    const versions = await ctx.clients.registry.listVersionsByApp(
      `${ctx.vtex.account}.${STORE_STATE}`
    )

    const index = versions.data.length - 1

    appID = versions.data[index].versionIdentifier
  } catch (err) {
    logger.warn(`Could not find previous versions of ${STORE_STATE}`)
  }

  const newAppID = bumpPatchVersion(appID)
  const { version } = parseAppId(newAppID)

  const { vbase } = ctx.clients
  const buildId = randomBytes(16).toString('hex')
  const buildHash = createHash('md5')
    .update(buildId)
    .digest('hex')

  const buildStatus: BuildStatus = {
    appId: newAppID,
    buildCode: 'WAITING_FOR_BUILD',
    buildId: buildHash,
    message: ' ',
  }

  saveBuildStatus({
    account: ctx.vtex.account,
    buildStatus,
    vbase,
    workspace: ctx.vtex.workspace,
  })

  const appFiles = await createEmptyAppFiles(version, ctx.vtex.account)
  const files = getFilesForBuilderHub(appFiles)

  const publishedApp = await ctx.clients.builder.publishApp(
    newAppID,
    files,
    { sticky: true },
    { buildHash } as any
  )

  logger.info(`Build result message: ${publishedApp.message}`)
  logger.info(
    `Finished building ${newAppID}. Please check to make sure the publishing was successful.`
  )

  const response = jsonResponse(buildHash)

  ctx.status = 200
  ctx.body = response

  await next()
}

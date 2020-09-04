import { createHash } from 'crypto'

import { parseAppId } from '@vtex/api'
import { json } from 'co-body'

import { InstallResponse } from '../clients/billing'
import { returnResponseError } from '../errors/responseError'
import { getBuildStatus } from '../util/vbase'

export async function checkPublishedApp(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const appID = body.buildId
  const { name } = parseAppId(appID)

  const { vbase } = ctx.clients
  const buildId = `${ctx.vtex.account}.${ctx.vtex.workspace}`
  const buildHash = createHash('md5')
    .update(buildId)
    .digest('hex')

  const buildStatus = await getBuildStatus(
    vbase,
    ctx.vtex.account,
    ctx.vtex.workspace
  )

  if (buildStatus.buildId !== buildHash || buildStatus.appId !== appID) {
    await returnResponseError({
      code: 'ERROR',
      ctx,
      message: 'App version asked for is not version requested for publishing',
      next,
    })

    return
  }

  if (buildStatus.buildCode === 'WAITING_FOR_BUILD') {
    ctx.status = 200
    ctx.body = `{"message": "${buildStatus.message}", "code": "${buildStatus.buildCode}"}`
    await next()

    return
  }

  if (buildStatus.buildCode === 'BUILD_FAILED') {
    await returnResponseError({
      code: buildStatus.buildCode,
      ctx,
      message: buildStatus.message,
      next,
    })
  }

  let installResponse: InstallResponse = { code: '' }

  try {
    installResponse = await ctx.clients.billings.installApp(appID, true, false)
  } catch (err) {
    logger.error(`Could not install ${name} - ${err}`)
    await returnResponseError({
      code: 'INSTALLATION_ERROR',
      ctx,
      message: JSON.stringify(installResponse),
      next,
    })

    return
  }

  ctx.status = 200
  ctx.body = `{"message": "success", "code": "SUCCESS"}`

  await next()
}

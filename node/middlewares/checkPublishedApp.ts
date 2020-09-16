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

  const { vbase } = ctx.clients
  const { buildId } = body

  const buildStatus = await getBuildStatus(
    vbase,
    ctx.vtex.account,
    ctx.vtex.workspace
  )

  if (buildStatus.buildId !== buildId) {
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

    return
  }

  const { appId } = buildStatus
  const { name } = parseAppId(appId)
  let installResponse: InstallResponse = { code: '' }

  try {
    installResponse = await ctx.clients.billings.installApp(appId, true, false)
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

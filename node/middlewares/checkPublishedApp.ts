import { parseAppId } from '@vtex/api'
import { json } from 'co-body'

import { InstallResponse } from '../clients/billing'
import { returnResponseError } from '../errors/responseError'

export async function checkPublishedApp(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const appID = body.buildId
  const { name, version } = parseAppId(appID)

  try {
    await ctx.clients.registry.getAppManifest(name, version)
  } catch (err) {
    logger.warn(`Could not find ${name}`)
    await returnResponseError({
      message: 'Error in build - could not find app',
      code: 'BUILD_FAILED',
      ctx,
      next,
    })

    return
  }

  let installResponse: InstallResponse = { code: '' }

  try {
    installResponse = await ctx.clients.billings.installApp(appID, true, false)
  } catch (err) {
    logger.warn(`Could not install ${name}`)
    await returnResponseError({
      message: JSON.stringify(installResponse),
      code: 'INSTALLATION_ERROR',
      ctx,
      next,
    })

    return
  }

  ctx.status = 201
  ctx.body = `{"message": "success", "code": "SUCCESS"}`

  await next()
}

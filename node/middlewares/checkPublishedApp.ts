import { parseAppId, Registry } from '@vtex/api'
import { json } from 'co-body'

import { InstallResponse } from '../clients/billing'
import { returnResponseError } from '../errors/responseError'

const MAX_RETRIES = 5
const RETRY_TIMEOUT_MS = 1000

const delay = (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time))
}

interface RetryCheckApp {
  registry: Registry
  name: string
  version: string
  retryCount?: number
}

const retryCheckApp = async ({
  registry,
  name,
  version,
  retryCount = 0,
}: RetryCheckApp): Promise<any> => {
  if (retryCount++ >= MAX_RETRIES) {
    throw new Error('Max retries exceeded')
  }

  try {
    await registry.getAppManifest(name, version)
  } catch (err) {
    console.info('Retrying', retryCount)
    await delay(RETRY_TIMEOUT_MS)

    return retryCheckApp({ registry, name, version, retryCount })
  }
}

export async function checkPublishedApp(
  ctx: Context,
  next: () => Promise<any>
) {
  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const appID = body.buildId
  const { name, version } = parseAppId(appID)

  try {
    await retryCheckApp({ registry: ctx.clients.registry, name, version })
  } catch (err) {
    logger.error(`Could not find ${name} - ${err}`)
    await returnResponseError({
      message: `Error in build - could not find app ${name}:${version}`,
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
    logger.error(`Could not install ${name} - ${err}`)
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

import { parseAppId } from '@vtex/api'
import { json } from 'co-body'
import { InstallResponse } from '../clients/billing'

async function didNotFindAppResponse(message: string, code: string, ctx: Context, next: () => Promise<any>){
  ctx.status = 404
  ctx.body = `{"message": "${message}", "code": "${code}"}`
  await next()
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
    await ctx.clients.registry.getAppManifest(name, version)
  } catch(err) {
    logger.warn(`Could not find ${name}`)
    await didNotFindAppResponse('Error in build - could not find app', 'BUILD_FAILED', ctx, next)
    return
  }

  let installResponse: InstallResponse = {code:''}
  try {
    installResponse = await ctx.clients.billings.installApp(appID, true, false)
  } catch(err) {
    logger.warn(`Could not install ${name}`)
    await didNotFindAppResponse(JSON.stringify(installResponse), 'INSTALLATION_ERROR', ctx, next)
    return
  }

  console.log(installResponse)

  ctx.status = 201
  ctx.body = `{"message": "success", "code": "SUCCESS"}`

  await next()
}

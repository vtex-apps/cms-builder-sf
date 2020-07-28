import { parseAppId } from '@vtex/api'
import { json } from 'co-body'
import { InstallResponse } from '../clients/billing'

async function didNotFindAppResponse(installResponse: InstallResponse, ctx: Context, next: () => Promise<any>){
  ctx.status = 200
  ctx.body = `{"status": "${JSON.stringify(installResponse.code)}"}`
  await next()
}

export async function checkPublishedApp(
  ctx: Context,
  next: () => Promise<any>
) {

  const { logger } = ctx.vtex
  const body = await json(ctx.req)

  const appID = body.buildId
  const { name } = parseAppId(appID)

  let installResponse: InstallResponse = {code:''}
  try {
    installResponse = await ctx.clients.billings.installApp(appID, true, false)
  } catch(err) {
    logger.warn(`Could not install ${name}`)
    await didNotFindAppResponse(installResponse, ctx, next)
    return
  }

  ctx.status = 200
  ctx.body = `{"status": "success"}`

  await next()
}

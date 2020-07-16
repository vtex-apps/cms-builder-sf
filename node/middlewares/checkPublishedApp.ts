import { parseAppId } from '@vtex/api'
import { InstallResponse } from '../clients/billing'

async function didNotFindAppResponse(ctx: Context, next: () => Promise<any>){
  ctx.status = 200
  ctx.body = `{"status": "fail"}`
  await next()
}

export async function checkPublishedApp(
  ctx: Context,
  next: () => Promise<any>
) {

  const { logger } = ctx.vtex
  const {
    vtex: {
      route: { params },
    },
  } = ctx
  const appID = params.code as string
  const { name } = parseAppId(appID)

  let installResponse: InstallResponse = {code:''}
  try {
    installResponse = await ctx.clients.billings.installApp(appID, true, false)
  } catch(err) {
    logger.warn(`Could not install ${name}`)
    await didNotFindAppResponse(ctx, next)
    return
  }

  console.log(installResponse)

  ctx.status = 200
  ctx.body = `{"status": "success"}`

  await next()
}

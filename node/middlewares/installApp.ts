import { parseAppId, RegistryAppVersionsList } from '@vtex/api'

async function didNotFindAppResponse(ctx: Context, next: () => Promise<any>){
  ctx.status = 200
  ctx.body = `{"status": "fail"}`
  await next()
}

export async function installApp(
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

  let versions: RegistryAppVersionsList = {data:[]}
  try {
    versions = await ctx.clients.registry.listVersionsByApp(name)
  } catch(err) {
    logger.warn(`Could not find previous versions of ${name}`)
    await didNotFindAppResponse(ctx, next)
    return
  }

  let foundApp = false
  versions.data.forEach(element => {
    if(element.versionIdentifier === appID) {
      foundApp = true
    }
  })

  if(foundApp === false){
    await didNotFindAppResponse(ctx, next)
    return
  }

  const installResponse = ctx.clients.billings.installApp(appID, true, false)
  console.log(installResponse)

  ctx.status = 200
  ctx.body = `{"status": "success"}`

  await next()
}

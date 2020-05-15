// import { File } from '@vtex/api/lib/clients/infra/Registry'
import {
  appIdToAppAtMajor,
  extractVersionFromAppId,
  removeVersionFromAppId,
} from '@vtex/api'
import { json } from 'co-body'
import { ensureDir } from 'fs-extra'

// import { createBaseFolder, extractFiles } from '../util/extractFiles'

// const version = '0.0.2'

export async function publishStoreFromPage(
  ctx: Context,
  next: () => Promise<any>
) {
  // const { logger } = ctx.vtex
  const body = await json(ctx.req)
  // eslint-disable-next-line no-console
  console.log({ body })

  const appName = `${ctx.vtex.account}.store-state@0.0.2`
  const filePath = 'test'
  await ensureDir(filePath)

  // const appAtMajor = appIdToAppAtMajor(appName)
  const appVersion = extractVersionFromAppId(appName)
  const app = removeVersionFromAppId(appName)
  const test = await ctx.clients.registry.unpackAppBundle(
    app,
    appVersion,
    '',
    filePath,
    false
  )
  // eslint-disable-next-line no-console
  console.log({ test })

  ctx.status = 200
  ctx.body = 'Deu certo :D'

  await next()
}

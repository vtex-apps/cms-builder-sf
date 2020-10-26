import { AppInstallResponse, Apps, IOContext, parseAppId } from '@vtex/api'
import { json } from 'co-body'

// import Billing, { InstallResponse } from '../clients/billing'
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
  let { targetWorkspace } = body

  if (targetWorkspace === undefined) {
    targetWorkspace = ctx.vtex.workspace
  }

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
  let installResponse: AppInstallResponse = { message: '' }

  if (targetWorkspace === ctx.vtex.workspace) {
    try {
      installResponse = (await ctx.clients.apps.installApp(
        appId
      )) as AppInstallResponse

      //   ctx.clients.billings.installApp(
      //   appId,
      //   true,
      //   false
      // )
    } catch (err) {
      logger.error(
        `Could not install ${name} - ${err}, ${JSON.stringify(installResponse)}`
      )
      await returnResponseError({
        code: 'INSTALLATION_ERROR',
        ctx,
        message: 'simple installation error',
        next,
      })

      return
    }
  } else {
    try {
      await ctx.clients.workspaces.get(ctx.vtex.account, targetWorkspace)
    } catch (err) {
      await ctx.clients.workspaces.create(
        ctx.vtex.account,
        targetWorkspace,
        false
      )
    }

    const newCtx = {
      ...ctx.vtex,
      timeout: 10000,
      workspace: targetWorkspace,
    } as IOContext

    const newApps = new Apps(newCtx)

    try {
      installResponse = (await newApps.installApp(appId)) as AppInstallResponse
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('error:', err)
      logger.error(`Could not install ${name} - ${err}`)
      await returnResponseError({
        code: 'INSTALLATION_ERROR',
        ctx,
        message: err,
        next,
      })

      return
    }
  }

  ctx.status = 200
  ctx.body = `{"message": "success", "code": "SUCCESS"}`

  await next()
}

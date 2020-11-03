import { AppInstallResponse, Apps, IOContext, parseAppId } from '@vtex/api'
import { json } from 'co-body'

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

  if (!targetWorkspace) {
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
    } catch (err) {
      logger.error(
        `Could not install ${name} - ${err}, ${JSON.stringify(installResponse)}`
      )
      await returnResponseError({
        code: 'INSTALLATION_ERROR',
        ctx,
        message: 'Installation error',
        next,
      })

      return
    }
  } else {
    if (ctx.vtex.workspace !== 'master') {
      logger.error(`Could not install ${name}}`)
      await returnResponseError({
        code: 'INSTALLATION_ERROR',
        ctx,
        message: 'Cannot install in another workspace in you are not in master',
        next,
      })

      return
    }

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
      timeout: 9000,
      workspace: targetWorkspace,
    } as IOContext

    const newApps = new Apps(newCtx)

    try {
      installResponse = (await newApps.installApp(appId)) as AppInstallResponse
    } catch (err) {
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

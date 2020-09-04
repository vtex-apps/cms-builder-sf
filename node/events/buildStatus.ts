import { EventContext, VBase } from '@vtex/api'

import { Clients } from '../clients'
import { STORE_STATE } from '../util/constants'
import { getBuildStatus, saveBuildStatus } from '../util/vbase'

export interface BuildStatus {
  appId: string
  buildCode: string
  buildId: string
  message: string
}

export async function buildStatus(
  ctx: EventContext<Clients, State>,
  next: () => Promise<void>
) {
  const event = parseEvent(ctx)

  if (!event.appId.includes(STORE_STATE)) {
    return
  }

  const { vbase } = ctx.clients

  const previousStatus = (await getBuildStatus(
    vbase,
    ctx.vtex.account,
    ctx.vtex.workspace
  )) as BuildStatus

  if (event.buildId !== previousStatus.buildId) {
    return
  }

  if (event.buildCode === 'success') {
    buildSuccess({
      account: ctx.vtex.account,
      previousStatus,
      vbase,
      workspace: ctx.vtex.workspace,
    })
  }

  if (event.buildCode === 'fail') {
    buildFail({
      account: ctx.vtex.account,
      event,
      previousStatus,
      vbase,
      workspace: ctx.vtex.workspace,
    })
  }

  next()
}

function parseEvent(ctx: EventContext<Clients, State>) {
  const [senderName] = ctx.sender.split('@')
  const { key, sender } = ctx
  const { code, subject, message } = ctx.body
  const { routeId } = ctx.body.builderHubIncomingRequestInfo
  const { buildHash, trigger } = ctx.body.builderHubIncomingRequestInfo
    .queryString || { trigger: 'toolbelt', ciHubRequestId: '' }

  return {
    appId: subject,
    buildCode: code,
    buildId: buildHash,
    key,
    message,
    routeId,
    sender,
    senderName,
    trigger,
  } as ColossusEvent
}

interface BuildSuccessArgs {
  previousStatus: BuildStatus
  vbase: VBase
  account: string
  workspace: string
}

function buildSuccess({
  previousStatus,
  vbase,
  account,
  workspace,
}: BuildSuccessArgs) {
  previousStatus.buildCode = 'SUCCESS'
  saveBuildStatus({ vbase, buildStatus: previousStatus, account, workspace })
}

interface BuildFailArgs {
  event: ColossusEvent
  previousStatus: BuildStatus
  vbase: VBase
  account: string
  workspace: string
}

function buildFail({
  event,
  previousStatus,
  vbase,
  account,
  workspace,
}: BuildFailArgs) {
  previousStatus.buildCode = 'BUILD_FAILED'
  previousStatus.message = event.message

  saveBuildStatus({ vbase, buildStatus: previousStatus, account, workspace })
}

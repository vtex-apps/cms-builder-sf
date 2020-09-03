import { EventContext } from '@vtex/api'

import { Clients } from '../clients'
import { STORE_STATE } from './../util/constants'

export async function build(
  ctx: EventContext<Clients, State>,
  next: () => Promise<void>
) {
  const event = parseEvent(ctx)

  if (!event.appId.includes(STORE_STATE)) {
    return
  }

  if (event.buildCode === 'success') {
    buildSuccess()
  }

  if (event.buildCode === 'fail') {
    buildFail(event)
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

function buildSuccess() {
  console.log('build was a success')
}

function buildFail(event: ColossusEvent) {
  console.log('build failed')
  console.log('Error message', event.message)
}

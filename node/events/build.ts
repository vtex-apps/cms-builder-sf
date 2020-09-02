import { EventContext } from '@vtex/api'

import { Clients } from '../clients'

export async function build(
  ctx: EventContext<Clients, State>,
  next: () => Promise<void>
) {
  const event = parseEvent(ctx)
  console.log(event)

  next()
}

function parseEvent(ctx: EventContext<Clients, State>) {
  const [senderName] = ctx.sender.split('@')
  const { key, sender } = ctx
  const { code, subject, message } = ctx.body
  const { routeId } = ctx.body.builderHubIncomingRequestInfo
  const { ciHubRequestId, trigger } = ctx.body.builderHubIncomingRequestInfo
    .queryString || { trigger: 'toolbelt', ciHubRequestId: '' }

  return {
    appId: subject,
    buildCode: code,
    buildId: ciHubRequestId,
    key,
    message,
    routeId,
    sender,
    senderName,
    trigger,
  } as ColossusEvent
}

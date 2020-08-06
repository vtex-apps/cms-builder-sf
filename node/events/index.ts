import {VBase} from '@vtex/api'
import errorHandler from './errorHandler'

export async function saveBuildInfo (ctx: ColossusEventContext, vbase: VBase, event: ColossusEvent): Promise<void> {
  const timestampMsec = (new Date()).getTime()
  const buildInfo = {
    appId: event.appId,
    buildId: event.buildId,
    timestampMsec,
    trigger: event.trigger,
  }
  const infoPath = `build/info/${event.buildId}`
  vbase.saveJSON('logs', infoPath, buildInfo)
    .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
}

export function parseEvent (ctx: ColossusEventContext): ColossusEvent {
  const senderName = ctx.sender.split('@')[0]

  const {key, sender} = ctx
  const {code, subject, message} = ctx.body
  const {routeId} = ctx.body.builderHubIncomingRequestInfo
  const {ciHubRequestId, trigger} = ctx.body.builderHubIncomingRequestInfo.queryString || {trigger: 'toolbelt', ciHubRequestId: ''}
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

export function validEvent (event: ColossusEvent) {
  return ((event.routeId === 'ci') || ((event.routeId === 'publish') && (event.trigger === 'github')))
}

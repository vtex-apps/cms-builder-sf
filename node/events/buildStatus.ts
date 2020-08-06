import { VBase } from '@vtex/api'
import * as crypto from 'crypto'
import { parseEvent, saveBuildInfo, validEvent } from '.'
import errorHandler from './errorHandler'

const buildCodeToGithubStatus: IStringToString = {
  'fail': 'failure',
  'success': 'success',
}

function validBuildCode (buildCode: string): boolean {
  return (buildCode in buildCodeToGithubStatus)
}

export async function savePublishInfo (ctx: ColossusEventContext,vbase: VBase, event: ColossusEvent): Promise<void> {
  const appId = event.appId
  const app = appId.split('@')[0]
  const appVersion = appId.split('@')[1]

  const publishExistencePath = `publish/${app}/${appVersion}/${event.buildId}`
  vbase.saveJSON('logs', publishExistencePath, {})
    .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))

  const appExistencePath = `app/${app}`
  vbase.saveJSON('logs', appExistencePath, {})
    .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
}

async function saveBuildStatusAsLog (ctx: ColossusEventContext, vbase: VBase, event: ColossusEvent): Promise<void> {
  let message = `build.status: ${event.buildCode}`
  if (event.message) {
    message += ` - ${event.message}`
  }
  const level = (event.buildCode === 'success') ? 'info' : 'error'

  const log = {
    body: {
      level,
      message,
      subject: 'subject',
    },
    key: event.key,
    sender: event.sender,
  }
  const eventId = crypto.randomBytes(8).toString('hex')
  const logPath = `build/logs/${event.buildId}/${eventId}`
  vbase.saveJSON('logs', logPath, log)
    .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
}

async function saveBuildStatus (ctx: ColossusEventContext, vbase: VBase, buildCode: string, buildId: string): Promise<void> {
  const path = `build/status/${buildId}`
  vbase.saveJSON('logs', path, {buildCode})
    .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
}

export default async function buildStatus (ctx: ColossusEventContext): Promise<void> {
  const event = parseEvent(ctx)
  if (validEvent(event) && validBuildCode(event.buildCode)) {
    const vbase = new VBase(ctx)

    saveBuildStatus(ctx, vbase, event.buildCode, event.buildId)
      .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
    saveBuildStatusAsLog(ctx, vbase, event)
      .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
    saveBuildInfo(ctx, vbase, event)
      .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
    if (event.routeId === 'publish') {
      savePublishInfo(ctx, vbase, event)
        .catch(error => errorHandler(error, true, ctx.clients.logger, ctx))
    }
  }
}

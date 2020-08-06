import { Logger } from '@vtex/api'
import { parseEvent } from '.'

// TODO: rethrow and log errors that are not operational
export default async function errorHandler (error: any, handled: boolean, logger?: Logger, ctx?: ColossusEventContext) {
  const event = ctx && parseEvent(ctx)
  const ciHubRequestId = event && event.buildId

  let logStatus
  let logBody
  let stackTrace
  if (error.response) { // AxiosError
    const { status, data } = error.response
    logStatus = status
    const message = {
      params: error.config && error.config.params,
      response: data,
      url: error.config && error.config.url,
    }
    logBody = {
      ciHubRequestId,
      code: data.code,
      message,
    }
    stackTrace = error.stack
  } else { // CustomError or other kind of Error
    logStatus = error.status || 500
    logBody = {
      ciHubRequestId,
      code: error.code,
      message: error.message,
    }
    stackTrace = error.stack
  }

  const logError = {
    eventKey: ctx && `${ctx.sender}_${ctx.key}`,
    handled,
    logBody,
    logStatus,
    stackTrace,
  }

  console.error(logError)
  if (logger) {
    logger.error(logError)
  }
}

import {
  Cached,
  ClientsConfig,
  Logger,
  LRUCache,
  method,
  ParamsContext,
  RecorderState,
  Service,
  ServiceContext,
} from '@vtex/api'

import { Clients } from './clients'
import errorHandler from './events/errorHandler'
import { checkPublishedApp } from './middlewares/checkPublishedApp'
import { emptyApp } from './middlewares/emptyApp'
import { methodNotAllowed } from './middlewares/methodNotAllowed'
import { publishStoreFromPage } from './middlewares/publishStoreFromPage'
import { unpublishPage } from './middlewares/unpublishPage'

const TIMEOUT_MS = 10000

// Create a LRU memory cache for the Status client.
// The @vtex/api HttpClient respects Cache-Control headers and uses the provided cache.
const memoryCache = new LRUCache<string, Cached>({ max: 5000 })

metrics.trackCache('status', memoryCache)

let lastLogger: Logger

function eventHandler (f: (ctx: ColossusEventContext) => Promise<void>) {
  return async (ctx: ColossusEventContext): Promise<void> => {
    const logger = new Logger(ctx)
    lastLogger = logger

    ctx.clients = {logger}

    try {
      await f(ctx)
    } catch (error) {
      errorHandler(ctx, true, logger, error)
    }
  }
}

// This is the configuration for clients available in `ctx.clients`.
const clients: ClientsConfig<Clients> = {
  // We pass our custom implementation of the clients bag, containing the Status client.
  implementation: Clients,
  options: {
    // All IO Clients will be initialized with these options, unless otherwise specified.
    default: {
      retries: 2,
      timeout: TIMEOUT_MS,
    },
    // This key will be merged with the default options and add this cache to our Status client.
    status: {
      memoryCache,
    },
  },
}

declare global {
  // We declare a global Context type just to avoid re-writing ServiceContext<Clients, State> in every handler and resolver
  type Context = ServiceContext<Clients, State>

  // The shape of our State object found in `ctx.state`. This is used as state bag to communicate between middlewares.
  interface State extends RecorderState {
    code: number
  }
}

// Export a service that defines route handlers and client options.
export default new Service<Clients, State, ParamsContext>({
  clients,
  events: {
    buildStatusBuilderHub: eventHandler(buildStatus),
  },
  routes: {
    emptyApp: method({
      DEFAULT: methodNotAllowed,
      POST: [emptyApp],
    }),
    install: method({
      DEFAULT: methodNotAllowed,
      PUT: [checkPublishedApp],
    }),
    status: method({
      DEFAULT: methodNotAllowed,
      POST: [publishStoreFromPage],
    }),
    unpublish: method({
      DEFAULT: methodNotAllowed,
      POST: [unpublishPage],
    }),
  }
})

import { IOClients } from '@vtex/api'

import Billing from './billing'
import Status from './status'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get status() {
    return this.getOrSet('status', Status)
  }

  public get billings(): Billing {
    return this.getOrSet('billings', Billing)
  }
}

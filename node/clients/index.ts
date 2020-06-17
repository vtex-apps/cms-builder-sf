import { IOClients } from '@vtex/api'

import Billing2 from './billing'
import Status from './status'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get status() {
    return this.getOrSet('status', Status)
  }

  public get billing2(): Billing2 {
    return this.getOrSet('billing2', Billing2)
  }
}

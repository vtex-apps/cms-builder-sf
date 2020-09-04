import { IOContext } from '@vtex/api'

declare global {

  interface IStringToString {
    [key: string]: string
  }

  interface ColossusEvent {
    appId: string
    key: string
    message: string
    sender: string
    senderName: string
    trigger: string
    buildId: string
    buildCode: string
    routeId: string
  }

  interface ColossusEventContext extends IOContext {
    key: string
    sender: string
    body: any
    clients: Clients
  }

}

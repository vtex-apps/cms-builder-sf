import { AppClient, InstanceOptions, IOContext } from '@vtex/api'

import { GraphQlError } from '../util/errors'

export interface InstallResponse {
  code: string
  billingOptions?: string
}

export default class Billing extends AppClient {
  constructor(ioContext: IOContext, opts?: InstanceOptions) {
    super('vtex.billing@0.x', ioContext, opts)
  }

  public installApp = async (
    appName: string,
    termsOfUseAccepted: boolean,
    force: boolean
  ): Promise<InstallResponse> => {
    const graphQLQuery = `mutation InstallApps{
      install(appName:"${appName}", termsOfUseAccepted:${termsOfUseAccepted}, force:${force}) {
        code
        billingOptions
      }
    }`

    const {
      data: { data, errors },
    } = await this.http.postRaw<any>(`/_v/graphql`, { query: graphQLQuery })

    if (errors) {
      throw new GraphQlError(errors)
    }

    return data.install
  }
}

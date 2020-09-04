import { VBase } from '@vtex/api'

import VBaseError from '../errors/vbaseError'
import { BuildStatus } from '../events/build'
import { VBASE_BUCKET } from './constants'

interface SaveBuildStatus {
  vbase: VBase
  buildStatus: BuildStatus
  account: string
  workspace: string
}

export function saveBuildStatus({
  vbase,
  buildStatus,
  account,
  workspace,
}: SaveBuildStatus) {
  const path = `build/status/${account}/${workspace}`

  vbase.saveJSON(VBASE_BUCKET, path, buildStatus).catch(error => {
    console.error(error)
    throw new VBaseError('Could not save build status to VBase')
  })
}

export async function getBuildStatus(
  vbase: VBase,
  account: string,
  workspace: string
) {
  const path = `build/status/${account}/${workspace}`

  const buildStatus = (await vbase.getJSON(VBASE_BUCKET, path).catch(error => {
    console.error(error)
    throw new VBaseError('Could not get build status from VBase')
  })) as BuildStatus

  return buildStatus
}

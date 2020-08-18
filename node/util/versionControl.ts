import { inc } from 'semver'

export function bumpPatchVersion(appID: string) {
  const [vendorAndName, version] = appID.split('@')
  const nextVersion = inc(version, 'minor')

  return `${vendorAndName}@${nextVersion}`
}

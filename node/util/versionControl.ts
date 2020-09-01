import { inc } from 'semver'

export const isProduction = process.env.VTEX_PRODUCTION === 'true'

export function bumpPatchVersion(appId: string) {
  const [vendorAndName, version] = appId.split('@')
  let nextVersion

  if (isProduction) {
    nextVersion = inc(version, 'minor')
  } else {
    nextVersion = inc(version, 'prerelease', 'beta')
  }

  return `${vendorAndName}@${nextVersion}`
}

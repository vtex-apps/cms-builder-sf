import { File } from '@vtex/api/lib/clients/infra/Registry'

import { STORE_STATE } from './constants'
import { makeDefaultManifest, Manifest } from './manifest'
import { makeRoutes, Routes, getRouteJSON } from './routes'
import { UploadFile } from './uploadFile'

export interface AppFiles {
  files: File[]
  manifest: Manifest
  routes: Routes
}

export async function createNewAppFiles(uploadFile: UploadFile, version: string, account: string){
  const pageFile: File = {
    content: uploadFile.file,
    path: `store/blocks/${uploadFile.title}.json`,
  }
  const manifest = await makeDefaultManifest(
    STORE_STATE,
    version,
    account
  )
  const routes = makeRoutes(uploadFile.page, uploadFile.slug)
  const appFiles: AppFiles = {files: [pageFile], manifest, routes}

  return appFiles
}

export function getFilesForBuilderHub(appFiles: AppFiles){
  const files = appFiles.files
  const manifestFile: File = {path: 'manifest.json', content: JSON.stringify(appFiles.manifest)}
  const routesFile: File = { path: `store/routes.json`, content: getRouteJSON(appFiles.routes) }
  files.push(manifestFile)
  files.push(routesFile)

  return files
}

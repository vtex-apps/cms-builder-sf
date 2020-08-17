import { File } from '@vtex/api/lib/clients/infra/Registry'
import { lstatSync, readdir, readJSON } from 'fs-extra'

import { STORE_STATE } from './constants'
import {
  makeDefaultManifest,
  makeEmptyManifest,
  Manifest,
  parseManifest,
  validateManifest,
} from './manifest'
import {
  addRoute,
  doesRouteExist,
  getRouteJSON,
  makeEmptyRoutes,
  makeRoutes,
  parseRoutes,
  removeRoute,
  Routes,
  updateRoutes,
} from './routes'
import { UploadFile } from './uploadFile'

export interface AppFiles {
  files: File[]
  manifest: Manifest
  routes: Routes
}

export async function createNewAppFiles(
  uploadFile: UploadFile,
  version: string,
  account: string
) {
  const pageFile: File = {
    content: uploadFile.file,
    path: `store/blocks/${uploadFile.page}.json`,
  }

  const manifest = await makeDefaultManifest(STORE_STATE, version, account)
  const routes = makeRoutes(uploadFile.page, uploadFile.slug)
  const appFiles: AppFiles = { files: [pageFile], manifest, routes }

  return appFiles
}

export function getFilesForBuilderHub(appFiles: AppFiles) {
  const { files } = appFiles

  const manifestFile: File = {
    path: 'manifest.json',
    content: JSON.stringify(appFiles.manifest),
  }

  const routesFile: File = {
    path: `store/routes.json`,
    content: getRouteJSON(appFiles.routes),
  }

  files.push(manifestFile)
  files.push(routesFile)

  return files
}

type ExtractUpdate = {
  uploadFile: UploadFile
  path: string
  mainPath: string
  version: string
}

export async function extractFilesAndUpdate({
  uploadFile,
  path,
  mainPath,
  version,
}: ExtractUpdate) {
  let appFiles = await extractFiles(path, mainPath)

  validateManifest(appFiles.manifest)
  appFiles = updateAppFiles(appFiles, uploadFile, version)

  return appFiles
}

type ExtractRemove = {
  pageToRemove: string
  path: string
  mainPath: string
  version: string
}

export async function extractFilesAndRemovePage({
  pageToRemove,
  path,
  mainPath,
  version,
}: ExtractRemove) {
  let appFiles = await extractFiles(path, mainPath)

  validateManifest(appFiles.manifest)
  appFiles = removePage(appFiles, pageToRemove, version)

  return appFiles
}

// TODO: fix await inside loops
async function extractFiles(path: string, mainPath: string) {
  const content = await readdir(path)
  let files = [] as File[]
  let manifest = makeEmptyManifest()
  let routes = makeEmptyRoutes()

  for (const i in content) {
    const fullPath = `${path}/${content[i]}`

    if (lstatSync(fullPath).isDirectory()) {
      // eslint-disable-next-line no-await-in-loop
      const folderFiles = await extractFiles(fullPath, mainPath)

      files = files.concat(folderFiles.files)
      if (folderFiles.routes.routes.length !== 0) {
        routes = folderFiles.routes
      }

      if (folderFiles.manifest.name !== '') {
        manifest = folderFiles.manifest
      }
    } else {
      const filePath = fullPath.replace(`${mainPath}/`, '')

      if (filePath.includes('manifest.json')) {
        // eslint-disable-next-line no-await-in-loop
        manifest = await parseManifest(mainPath)
      } else if (filePath.includes('routes.json')) {
        // eslint-disable-next-line no-await-in-loop
        routes = await parseRoutes(fullPath)
      } else {
        // eslint-disable-next-line no-await-in-loop
        const fileContent = await readJSON(fullPath)
        const file: File = {
          path: filePath,
          content: JSON.stringify(fileContent),
        }

        files.push(file)
      }
    }
  }

  const appFiles: AppFiles = { files, manifest, routes }

  return appFiles
}

function updateAppFiles(
  appFiles: AppFiles,
  uploadFile: UploadFile,
  version: string
) {
  if (doesRouteExist(appFiles.routes, uploadFile.page)) {
    appFiles = updatePage(appFiles, uploadFile)
  } else {
    appFiles = addPage(appFiles, uploadFile)
  }

  appFiles.manifest.version = version

  return appFiles
}

function addPage(appFiles: AppFiles, uploadFile: UploadFile) {
  const newPageFile: File = {
    content: uploadFile.file,
    path: `store/blocks/${uploadFile.page}.json`,
  }

  appFiles.files.push(newPageFile)

  appFiles.routes = addRoute(appFiles.routes, uploadFile.page, uploadFile.slug)

  return appFiles
}

function updatePage(appFiles: AppFiles, uploadFile: UploadFile) {
  appFiles.files.forEach(file => {
    if (file.path.includes(`${uploadFile.page}.json`)) {
      file.content = uploadFile.file
    }
  })

  appFiles.routes = updateRoutes(
    appFiles.routes,
    uploadFile.page,
    uploadFile.slug
  )

  return appFiles
}

function removePage(appFiles: AppFiles, pageToRemove: string, version: string) {
  const routes = removeRoute(appFiles.routes, pageToRemove)

  appFiles.files.forEach((file, index) => {
    if (file.content.includes(pageToRemove)) {
      appFiles.files.splice(index, 1)
    }
  })

  appFiles.routes = routes
  appFiles.manifest.version = version

  return appFiles
}

import { Logger } from '@vtex/api'
import { File } from '@vtex/api/lib/clients/infra/Registry'
import { lstatSync, readdir, readJSON } from 'fs-extra'

import { version } from '../middlewares/publishStore'

export interface UploadFile {
  name: string
  file: string
  path: string | ''
}

export async function findFile(uploadFile: UploadFile, path: string, logger: Logger) {
  let filePath = ''
  const content = await readdir(path)
  // tslint:disable-next-line:forin
  for (const i in content) {
    const fullPath = `${path}/${content[i]}`
      if (lstatSync(fullPath).isDirectory()) {
        const tempFilePath = await findFile(uploadFile, fullPath, logger)
        if (tempFilePath !== '') {
          filePath = tempFilePath
        }
      }
      else if (fullPath.includes(uploadFile.name)) {
        filePath = fullPath
      }
  }
  return filePath
}

export async function uploadAndExtractFiles(uploadFile: UploadFile, path: string, mainPath: string) {
  let files = [] as File[]
  const content = await readdir(path)
  // tslint:disable-next-line:forin
  for (const i in content) {
    const fullPath = `${path}/${content[i]}`
      if (lstatSync(fullPath).isDirectory()) {
        const folderFiles = await uploadAndExtractFiles(uploadFile, fullPath, mainPath)
        files = files.concat(folderFiles)
      } else{
        const filePath = fullPath.replace(`${mainPath}/`, '')
        let fileContent = ''
        if (fullPath.includes(uploadFile.name)) {
          fileContent = uploadFile.file
        } else {
          fileContent = await readJSON(fullPath)
        }

        if(filePath.includes('manifest')) {
          fileContent = updateManifest(fileContent)
        }

        const file: File = { path: filePath , content: JSON.stringify(fileContent)}
        files.push(file)
      }
  }
  return files
}

function updateManifest(manifest: any){
  manifest.version = version
  return manifest
}

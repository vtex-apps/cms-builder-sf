import { File } from '@vtex/api/lib/clients/infra/Registry'
import { lstatSync, readdir, readJSON } from 'fs-extra'

import { version } from '../middlewares/publishStore'

export interface UploadFile {
  title: string
  file: string
  slug: string
  page: string
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
        if (fullPath.includes(uploadFile.title)) {
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

import { File } from '@vtex/api/lib/clients/infra/Registry'
import { ensureDir, pathExists, remove, writeJSON } from 'fs-extra'

export async function createBaseFolder(path: string, account: string, workspace: string){
  if( pathExists(path) ){
    await remove(path)
  }
  const newPath = `${path}/${account}/${workspace}`
  await ensureDir(`${newPath}/store`)

  return newPath
}

export async function extractFiles(body: any, path: string, mainPath: string) {
  let files = [] as File[]
  for (const i in body) {
    if(body[i].type === 'folder') {
      const newPath = await makeFolder(path, body[i].name)
      const folderFiles = await extractFiles(body[i].content, newPath, mainPath)
      files = files.concat(folderFiles)
    }
    else {
      const filePath = `${path}/${body[i].name}.${body[i].type}`
      await writeJSON(filePath, body[i].content)
      const file: File = { path: filePath.replace(`${mainPath}/`, '') , content: JSON.stringify(body[i].content)}
      files.push(file)
    }
  }
  return files
}

async function makeFolder(path: string, name: string) {
  const newPath = `${path}/${name}`
  await ensureDir(newPath)
  return newPath
}

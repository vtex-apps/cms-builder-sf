import { File } from '@vtex/api/lib/clients/infra/Registry'
import { mkdirs, remove, writeJSON } from 'fs-extra'

export async function createBaseFolder(path: string, account: string, workspace: string){
  await remove(path)
  await mkdirs(path)
  path = path + '/' + account
  await mkdirs(path)
  path = path + '/' + workspace
  await mkdirs(path)
  const newPath = path + '/store'
  await mkdirs(newPath)

  return path
}

export async function parseJSON(body: any, path: string, mainPath: string) {
  let files = [] as File[]
  for (const i in body) {
    if(body[i].type === 'folder') {
      const newPath = await makeFolder(path, body[i].name)
      const folderFiles = await parseJSON(body[i].content, newPath, mainPath)
      files = files.concat(folderFiles)
    }
    else {
      const filePath = path + '/' + body[i].name + '.' + body[i].type
      await writeJSON(filePath, body[i].content)
      const file: File = { path: filePath.replace(mainPath + '/', '') , content: JSON.stringify(body[i].content)}
      files.push(file)
    }
  }
  return files
}

async function makeFolder(path: string, name: string) {
  const newPath = path + '/' + name
  await mkdirs(newPath)
  return newPath
}

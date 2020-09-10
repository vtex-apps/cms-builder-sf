import { File } from '@vtex/api/lib/clients/infra/Registry'
import { pathExists, remove, writeJSON, emptyDir } from 'fs-extra'

export async function createBaseFolderWithStore(
  path: string,
  account: string,
  workspace: string
) {
  const newPath = createBaseFolder(path, account, workspace)

  await emptyDir(`${newPath}/store`)

  return newPath
}

export async function createBaseFolder(
  path: string,
  account: string,
  workspace: string
) {
  if (pathExists(path)) {
    await remove(path)
  }

  const newPath = `${path}/${account}/${workspace}`

  await emptyDir(newPath)

  return newPath
}

// TODO: fix await inside loops
export async function extractFiles(body: any, path: string, mainPath: string) {
  let files = [] as File[]

  for (const i in body) {
    if (body[i].type === 'folder') {
      // eslint-disable-next-line no-await-in-loop
      const newPath = await makeFolder(path, body[i].name)

      // eslint-disable-next-line no-await-in-loop
      const folderFiles = await extractFiles(body[i].content, newPath, mainPath)

      files = files.concat(folderFiles)
    } else {
      const filePath = `${path}/${body[i].name}.${body[i].type}`

      // eslint-disable-next-line no-await-in-loop
      await writeJSON(filePath, body[i].content)

      const file: File = {
        path: filePath.replace(`${mainPath}/`, ''),
        content: JSON.stringify(body[i].content),
      }

      files.push(file)
    }
  }

  return files
}

async function makeFolder(path: string, name: string) {
  const newPath = `${path}/${name}`

  await emptyDir(newPath)

  return newPath
}

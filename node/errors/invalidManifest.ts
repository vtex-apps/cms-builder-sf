import CustomError from './customError'

export default class InvalidManifest extends CustomError {
  public code = 'invalid_manifest'
  public status = 400
  constructor(message: string) {
    super(`Invalid manifest.json: ${message}`)
  }
}

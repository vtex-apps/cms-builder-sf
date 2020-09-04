import CustomError from './customError'

export default class VBaseError extends CustomError {
  public code = 'vbase_error'
  public status = 400
  constructor(message: string) {
    super(`VBase error: ${message}`)
  }
}

import CustomError from './customError'

export default class InvalidDependency extends CustomError {
  public code = 'invalid_dependency'
  public status = 400
  constructor(message: string) {
    super(`Invalid dependency: ${message}`)
  }
}

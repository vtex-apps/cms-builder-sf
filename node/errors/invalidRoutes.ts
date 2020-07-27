import CustomError from './customError'

export default class InvalidRoutes extends CustomError {
  public code = 'invalide_routes'
  public status = 400
  constructor(message: string) {
    super(`Invalid routes.json: ${message}`)
  }
}

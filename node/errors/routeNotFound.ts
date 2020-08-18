import CustomError from './customError'

export default class RouteNotFound extends CustomError {
  public code = 'route_not_found'
  public status = 400

  constructor(message: string) {
    super(`Route not found: ${message}`)
  }
}

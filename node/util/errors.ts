import ExtendableError from 'extendable-error'
import { compose, join, map, prop, reject } from 'ramda'
import { isFunction } from 'ramda-adjunct'

const joinErrorMessages = compose<any[], any[], string[], string>(
  join('\n'),
  map(prop('message')),
  reject(isFunction)
)

export class GraphQlError extends ExtendableError {
  constructor(errors: [any]) {
    const message = joinErrorMessages(errors)

    super(message)
  }
}

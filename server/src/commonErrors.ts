import { RouteError } from './route'

export const commonErrors = {
  emptyRecords: {
    code: 'DATABASE',
    message: 'An empty dataset was returned unexpectedly'
  } as RouteError
}

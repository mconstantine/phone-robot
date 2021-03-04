import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import SQL from 'sql-template-strings'
import { dbGetAll } from '../database/utils'
import {
  HandlerInputWithAuth,
  makeRoute,
  okRouteResponse,
  RouteError,
  RouteResponse
} from '../route'
import { User, DatabaseUser } from './userDatabase'

const UnapprovedUsers = t.array(User, 'UnapprovedUsers')

function listUnapproved(
  input: HandlerInputWithAuth<unknown, unknown>
): TaskEither<RouteError, RouteResponse<User[]>> {
  return pipe(
    input.currentUser.approved,
    boolean.fold(
      () =>
        taskEither.left<RouteError>({
          code: 'FORBIDDEN',
          message: 'Only approved users can see unapproved users'
        }),
      () => taskEither.right(void 0)
    ),
    taskEither.chain(() =>
      dbGetAll(SQL`SELECT * FROM user WHERE approved = 0`, DatabaseUser)
    ),
    taskEither.map(okRouteResponse)
  )
}

export const listUnapprovedRoute = makeRoute(
  t.unknown,
  UnapprovedUsers,
  t.unknown,
  listUnapproved
)

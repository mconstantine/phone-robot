import * as t from 'io-ts'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  HandlerInputWithAuth,
  makeRoute,
  okRouteResponse,
  RouteError,
  RouteResponse
} from '../route'
import { UserMutationParams } from './userCommon'
import { deleteUser, getUserById, User } from './userDatabase'

function remove(
  input: HandlerInputWithAuth<unknown, UserMutationParams>
): TaskEither<RouteError, RouteResponse<User>> {
  return pipe(
    getUserById(input.params.id),
    taskEither.chain(
      taskEither.fromOption<RouteError>(() => ({
        code: 'NOT_FOUND',
        message: 'The user to be deleted was not found'
      }))
    ),
    taskEither.chain(user =>
      pipe(
        user.id === input.currentUser.id,
        boolean.fold(
          () =>
            taskEither.left<RouteError>({
              code: 'FORBIDDEN',
              message: 'You cannot delete other users'
            }),
          () => taskEither.right(user)
        )
      )
    ),
    taskEither.chain(user =>
      pipe(
        deleteUser(user.id),
        taskEither.chain(() => taskEither.fromIO(() => user))
      )
    ),
    taskEither.map(okRouteResponse)
  )
}

export const deleteRoute = makeRoute(
  t.unknown,
  User,
  UserMutationParams,
  remove
)

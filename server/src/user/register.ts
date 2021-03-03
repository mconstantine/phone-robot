import { NonEmptyString } from 'io-ts-types'
import * as t from 'io-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  createdRouteResponse,
  makeRoute,
  RouteError,
  RouteResponse
} from '../route'
import { createSessionData, SessionData } from './common'
import { constVoid, pipe } from 'fp-ts/function'
import { dbGet } from '../database/utils'
import SQL from 'sql-template-strings'
import { NonNegativeInteger, PositiveInteger } from '../globalDomain'
import { boolean, either, taskEither } from 'fp-ts'
import { commonErrors } from '../commonErrors'
import { createUser, updateUser } from './database'
import { hash } from '../lib/bcryptjs'

const RegisterInput = t.type({
  username: NonEmptyString,
  password: NonEmptyString,
  passwordConfirmation: NonEmptyString
})
type RegisterInput = t.TypeOf<typeof RegisterInput>

function register(
  input: RegisterInput
): TaskEither<RouteError, RouteResponse<SessionData>> {
  if (input.password !== input.passwordConfirmation) {
    return taskEither.left<RouteError>({
      code: 'INVALID_INPUT',
      message: "Passwords don't match"
    })
  }

  const encryptedPassword = hash(input.password)

  if (either.isLeft(encryptedPassword)) {
    return taskEither.left(encryptedPassword.left)
  }

  const user = {
    username: input.username,
    password: encryptedPassword.right
  }

  return pipe(
    dbGet(
      SQL`SELECT COUNT(*) AS sameUsername FROM user WHERE username = ${user.username}`,
      t.type({
        sameUsername: NonNegativeInteger
      })
    ),
    taskEither.chain(taskEither.fromOption(() => commonErrors.emptyRecords)),
    taskEither.chain(({ sameUsername }) =>
      pipe(
        sameUsername > 0,
        boolean.fold(
          () => taskEither.rightIO(constVoid),
          () =>
            taskEither.left<RouteError>({
              code: 'CONFLICT',
              message: 'A user with this username already exists'
            })
        )
      )
    ),
    taskEither.chain(() => createUser(user)),
    taskEither.chain(({ lastID }) =>
      pipe(
        dbGet(
          SQL`SELECT COUNT(*) AS allUsersCount FROM user`,
          t.type({
            allUsersCount: PositiveInteger
          })
        ),
        taskEither.chain(
          taskEither.fromOption(() => commonErrors.emptyRecords)
        ),
        taskEither.chain(({ allUsersCount }) =>
          pipe(
            allUsersCount > 1,
            boolean.fold(
              () => updateUser(lastID, { ...user, approved: true }) as any,
              () => taskEither.rightIO(constVoid)
            )
          )
        ),
        taskEither.chain(() =>
          taskEither.fromEither(createSessionData(lastID))
        ),
        taskEither.map(createdRouteResponse)
      )
    )
  )
}

export const registerRoute = makeRoute(RegisterInput, SessionData, register)

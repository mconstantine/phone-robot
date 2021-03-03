import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import {
  BooleanFromNumber,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import {
  HandlerInputWithAuth,
  makeRoute,
  okRouteResponse,
  RouteError,
  RouteResponse
} from '../route'
import {
  getUserById,
  getUserByUsername,
  updateUser,
  User
} from './userDatabase'
import { UserMutationParams } from './userCommon'

const UserUpdateInput = t.type(
  {
    username: optionFromNullable(NonEmptyString),
    approved: optionFromNullable(BooleanFromNumber),
    password: optionFromNullable(NonEmptyString),
    passwordConfirmation: optionFromNullable(NonEmptyString)
  },
  'UserUpdateInput'
)
type UserUpdateInput = t.TypeOf<typeof UserUpdateInput>

function update(
  input: HandlerInputWithAuth<UserUpdateInput, UserMutationParams>
): TaskEither<RouteError, RouteResponse<User>> {
  return pipe(
    getUserById(input.params.id),
    taskEither.chain(
      taskEither.fromOption<RouteError>(() => ({
        code: 'NOT_FOUND',
        message: 'The user to be updated was not found'
      }))
    ),
    taskEither.chain(user =>
      pipe(
        input.body.username,
        option.fold(
          () => taskEither.right(user),
          username =>
            pipe(
              username !== user.username,
              boolean.fold(
                () => taskEither.right(user),
                () =>
                  pipe(
                    getUserByUsername(username),
                    taskEither.chain(
                      option.fold(
                        () => taskEither.right(user),
                        () =>
                          taskEither.left<RouteError>({
                            code: 'CONFLICT',
                            message:
                              'A user with the username you want to use already exists'
                          })
                      )
                    )
                  )
              )
            )
        )
      )
    ),
    taskEither.chain(user =>
      pipe(
        input.body.approved,
        option.fold(
          () => taskEither.right(user),
          boolean.fold(
            () =>
              taskEither.left<RouteError>({
                code: 'FORBIDDEN',
                message: 'Users cannot be disabled'
              }),
            () =>
              pipe(
                user.id !== input.currentUser.id,
                boolean.fold(
                  () =>
                    taskEither.left<RouteError>({
                      code: 'FORBIDDEN',
                      message: 'You cannot approve yourself'
                    }),
                  () => taskEither.right(user)
                )
              )
          )
        )
      )
    ),
    taskEither.chain(user =>
      pipe(
        {
          password: input.body.password,
          passwordConfirmation: input.body.passwordConfirmation
        },
        sequenceS(option.option),
        option.fold(
          () => taskEither.right(user),
          ({ password, passwordConfirmation }) =>
            pipe(
              password === passwordConfirmation,
              boolean.fold(
                () =>
                  taskEither.left<RouteError>({
                    code: 'INVALID_INPUT',
                    message: "Passwords don't match"
                  }),
                () => taskEither.right(user)
              )
            )
        )
      )
    ),
    taskEither.chain(user => {
      const data = {
        username: option.toUndefined(input.body.username),
        approved: option.toUndefined(input.body.approved),
        ...pipe(
          {
            password: input.body.password,
            passwordConfirmation: input.body.passwordConfirmation
          },
          sequenceS(option.option),
          option.fold(
            () => ({}),
            ({ password }) => ({ password })
          )
        )
      }
      return pipe(
        updateUser(user.id, data),
        taskEither.chain(() => getUserById(user.id))
      )
    }),
    taskEither.chain(
      taskEither.fromOption<RouteError>(() => ({
        code: 'UNKNOWN',
        message: 'Unable to find the user after the update'
      }))
    ),
    taskEither.map(okRouteResponse)
  )
}

export const updateRoute = makeRoute(
  UserUpdateInput,
  User,
  UserMutationParams,
  update
)

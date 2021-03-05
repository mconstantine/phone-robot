import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { apiCall } from '../../useApi'

export const LoginInput = t.type({
  username: NonEmptyString,
  password: NonEmptyString
})
export type LoginInput = t.TypeOf<typeof LoginInput>

const SessionData = t.type({
  accessToken: NonEmptyString,
  refreshToken: NonEmptyString,
  expiration: DateFromISOString
})

export const login = apiCall('/users/login', SessionData, LoginInput)

export const RegistrationInput = t.type({
  username: NonEmptyString,
  name: NonEmptyString,
  password: NonEmptyString,
  passwordConfirmation: NonEmptyString
})
export type RegistrationInput = t.TypeOf<typeof RegistrationInput>

export const register = apiCall(
  '/users/register',
  SessionData,
  RegistrationInput
)

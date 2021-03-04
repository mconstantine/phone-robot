import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { apiCall } from '../../useApi'

const LoginInput = t.type({
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

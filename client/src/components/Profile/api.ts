import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { PositiveInteger } from '../../globalDomain'
import { apiCall } from '../../useApi'

const User = t.type({
  id: PositiveInteger,
  username: NonEmptyString,
  name: NonEmptyString,
  approved: t.boolean,
  created_at: DateFromISOString,
  updated_at: DateFromISOString
})
export type User = t.TypeOf<typeof User>

export const UserUpdateInput = t.partial({
  username: NonEmptyString,
  name: NonEmptyString,
  password: NonEmptyString,
  passwordConfirmation: NonEmptyString
})
export type UserUpdateInput = t.TypeOf<typeof UserUpdateInput>

export const getProfile = apiCall('/users/me', User)

export const updateProfile = (id: PositiveInteger) =>
  apiCall(`/users/${id}`, User, UserUpdateInput)

export const deleteProfile = (id: PositiveInteger) =>
  apiCall(`/users/${id}`, User)

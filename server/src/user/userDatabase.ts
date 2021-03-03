import * as t from 'io-ts'
import {
  BooleanFromNumber,
  DateFromISOString,
  NonEmptyString
} from 'io-ts-types'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../database/utils'
import { DateFromSQLString, PositiveInteger } from '../globalDomain'

export const User = t.strict(
  {
    id: PositiveInteger,
    username: NonEmptyString,
    approved: BooleanFromNumber,
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'User'
)
export type User = t.TypeOf<typeof User>

const DatabaseUser = t.strict(
  {
    id: PositiveInteger,
    username: NonEmptyString,
    approved: BooleanFromNumber,
    created_at: DateFromSQLString,
    updated_at: DateFromSQLString
  },
  'DatabaseUser'
)
type DatabaseUser = t.TypeOf<typeof DatabaseUser>

const UserCreationInput = t.strict(
  {
    username: NonEmptyString,
    password: NonEmptyString
  },
  'UserCreationInput'
)
type UserCreationInput = t.TypeOf<typeof UserCreationInput>

const UserUpdateInput = t.partial(
  {
    username: NonEmptyString,
    password: NonEmptyString,
    approved: BooleanFromNumber
  },
  'UserUpdateInput'
)
type UserUpdateInput = t.TypeOf<typeof UserUpdateInput>

export function createUser(input: UserCreationInput) {
  return insert('user', input, UserCreationInput)
}

export function updateUser(id: PositiveInteger, input: UserUpdateInput) {
  return update('user', id, input, UserUpdateInput)
}

export function deleteUser(id: PositiveInteger) {
  return remove('user', { id })
}

export function getUserById(id: PositiveInteger) {
  return dbGet(SQL`SELECT * FROM user WHERE id = ${id}`, DatabaseUser)
}

export function getUserByUsername(username: NonEmptyString) {
  return dbGet(
    SQL`SELECT * FROM user WHERE username = ${username}`,
    DatabaseUser
  )
}

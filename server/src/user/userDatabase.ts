import * as t from 'io-ts'
import { BooleanFromNumber, NonEmptyString } from 'io-ts-types'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../database/utils'
import { DateFromSQLString, PositiveInteger } from '../globalDomain'

const User = t.strict({
  id: PositiveInteger,
  username: NonEmptyString,
  password: NonEmptyString,
  approved: BooleanFromNumber,
  created_at: DateFromSQLString,
  updated_at: DateFromSQLString
}, 'User')
type User = t.TypeOf<typeof User>

const UserCreationInput = t.strict({
  username: NonEmptyString,
  password: NonEmptyString
}, 'UserCreationInput')
type UserCreationInput = t.TypeOf<typeof UserCreationInput>

const UserUpdateInput = t.strict({
  username: NonEmptyString,
  password: NonEmptyString,
  approved: BooleanFromNumber
}, 'UserUpdateInput')
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
  return dbGet(SQL`SELECT * FROM user WHERE id = ${id}`, User)
}

export function getUserByUsername(username: NonEmptyString) {
  return dbGet(SQL`SELECT * FROM user WHERE username = ${username}`, User)
}

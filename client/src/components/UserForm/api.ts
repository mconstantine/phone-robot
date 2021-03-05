import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { PositiveInteger } from '../../globalDomain'

const User = t.type({
  id: PositiveInteger,
  username: NonEmptyString,
  name: NonEmptyString,
  created_at: DateFromISOString,
  updated_at: DateFromISOString
})
export type User = t.TypeOf<typeof User>

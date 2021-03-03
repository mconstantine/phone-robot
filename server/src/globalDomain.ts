import { either } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { date, IntFromString } from 'io-ts-types'

interface PositiveIntegerBrand {
  readonly PositiveInteger: unique symbol
}
export const PositiveInteger = t.brand(
  t.Int,
  (n): n is t.Branded<t.Int, PositiveIntegerBrand> => n > 0,
  'PositiveInteger'
)
export type PositiveInteger = t.TypeOf<typeof PositiveInteger>

export const PositiveIntegerFromString: t.Type<
  PositiveInteger,
  string
> = new t.Type(
  'PositiveIntegerFromString',
  (u): u is PositiveInteger => IntFromString.is(u) && PositiveInteger.is(u),
  (u, c) =>
    pipe(
      IntFromString.validate(u, c),
      either.chain(n => PositiveInteger.validate(n, c))
    ),
  n => n.toString(10)
)

interface NonNegativeIntegerBrand {
  readonly NonNegativeInteger: unique symbol
}
export const NonNegativeInteger = t.brand(
  t.Int,
  (n): n is t.Branded<t.Int, NonNegativeIntegerBrand> => n >= 0,
  'NonNegativeInteger'
)
export type NonNegativeInteger = t.TypeOf<typeof NonNegativeInteger>

const sqlDatePattern = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/
export const DateFromSQLString: t.Type<Date, string> = new t.Type(
  'DateFromSQLString',
  date.is,
  (u, c) =>
    pipe(
      t.string.validate(u, c),
      either.chain(s => {
        if (!sqlDatePattern.test(s)) {
          return t.failure(u, c)
        }

        const [, year, month, date, hours, minutes, seconds] = s
          .match(sqlDatePattern)!
          .map(s => parseInt(s, 10))

        return t.success(
          new Date(year!, month! - 1, date!, hours!, minutes!, seconds!)
        )
      })
    ),
  d => {
    const leadZero = (n: number) => (n < 10 ? '0' : '') + n
    const year = d.getFullYear().toString(10)
    const month = leadZero(d.getMonth() + 1)
    const date = leadZero(d.getDate())
    const hours = leadZero(d.getHours())
    const minutes = leadZero(d.getMinutes())
    const seconds = leadZero(d.getSeconds())

    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
  }
)
export type DateFromSQLString = t.TypeOf<typeof DateFromSQLString>

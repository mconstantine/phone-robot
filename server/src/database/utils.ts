import { array, either, nonEmptyArray, option, record, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { SQLStatement } from 'sql-template-strings'
import { Database, ISqlite, open, Statement } from 'sqlite'
import { NonNegativeInteger, PositiveInteger } from '../globalDomain'
import { RouteError } from '../route'
import path from 'path'
import { cached } from 'sqlite3'
import * as t from 'io-ts'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Reader } from 'fp-ts/Reader'
import { getDecodeErrors } from '../lib/codecs'

interface InsertResult {
  statement: Statement
  lastID: PositiveInteger
}

interface EditResult {
  statement: Statement
  changes: NonNegativeInteger
}

let database: Option<Database> = option.none

export function getDatabase(): TaskEither<RouteError, Database> {
  return pipe(
    database,
    option.fold(
      () =>
        pipe(
          taskEither.tryCatch(
            () =>
              open({
                filename: path.join(process.cwd(), 'data.db'),
                driver: cached.Database
              }),
            (error): RouteError => ({
              code: 'DATABASE',
              message: 'Unable to access database',
              error: error as Error
            })
          ),
          taskEither.chain(db =>
            taskEither.fromIO(() => {
              database = option.some(db)
              return db
            })
          )
        ),
      database => taskEither.fromIO(() => database)
    )
  )
}

export function dbRun(
  query: ISqlite.SqlType,
  ...args: any[]
): TaskEither<RouteError, ISqlite.RunResult> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.run(query, ...args),
        (error): RouteError => ({
          code: 'DATABASE',
          message: 'Unable to run a statement agains the database',
          error: error as Error
        })
      )
    )
  )
}

export function dbExec(query: SQLStatement): TaskEither<RouteError, void> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.exec(query),
        (error): RouteError => ({
          code: 'DATABASE',
          message: 'Unable to execute a database statement',
          error: error as Error
        })
      )
    )
  )
}

export function dbGet<O, OO>(
  query: SQLStatement,
  codec: t.Type<O, OO>
): TaskEither<RouteError, Option<O>> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.get<OO>(query),
        (error): RouteError => ({
          code: 'DATABASE',
          message: 'Unable to fetch from database',
          error: error as Error
        })
      )
    ),
    taskEither.chain(
      flow(
        option.fromNullable,
        option.map(codec.decode),
        option.fold(
          () => taskEither.right(option.none),
          flow(
            taskEither.fromEither,
            taskEither.bimap(
              (errors): RouteError => ({
                code: 'DECODING',
                message: getDecodeErrors(errors)
              }),
              option.some
            )
          )
        )
      )
    )
  )
}

export function dbGetAll<O, OO>(
  query: SQLStatement,
  codec: t.Type<O, OO>
): TaskEither<RouteError, O[]> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.all<OO[]>(query),
        (error): RouteError => ({
          code: 'DATABASE',
          message: 'Unable to fetch from database',
          error: error as Error
        })
      )
    ),
    taskEither.chain(
      flow(
        array.map(codec.decode),
        array.sequence(either.either),
        taskEither.fromEither,
        taskEither.mapLeft(
          (errors): RouteError => ({
            code: 'DECODING',
            message: getDecodeErrors(errors)
          })
        )
      )
    )
  )
}

export function insert<I extends Record<string, any>, II>(
  tableName: string,
  _rows: I | NonEmptyArray<I>,
  codec: t.Type<I, II>
): TaskEither<RouteError, InsertResult> {
  const rows: NonEmptyArray<II> = pipe(
    Array.isArray(_rows) ? _rows : nonEmptyArray.of(_rows),
    nonEmptyArray.map(removeUndefined) as Reader<
      NonEmptyArray<I>,
      NonEmptyArray<I>
    >,
    nonEmptyArray.map(codec.encode)
  )

  const columns = `\`${Object.keys(rows[0]).join('`, `')}\``

  const values = `${rows
    .map(row => new Array(Object.keys(row).length).fill('?').join(', '))
    .join('), (')}`

  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`
  const args = rows.map(row => Object.values(row)).flat()

  return pipe(
    dbRun(query, ...args),
    taskEither.chain(result =>
      pipe(
        result.lastID,
        option.fromNullable,
        option.fold(
          () =>
            taskEither.left<RouteError>({
              code: 'DATABASE',
              message: 'Insert query did not return lastID'
            }),
          lastID =>
            taskEither.right({
              statement: result.stmt,
              lastID: lastID as PositiveInteger
            })
        )
      )
    )
  )
}

export function update<I extends Record<string, any>, II>(
  tableName: string,
  id: PositiveInteger,
  row: I,
  codec: t.Type<I, II>
): TaskEither<RouteError, EditResult> {
  const encodedRow = codec.encode(row)

  // Magic reduce from { key: value } to [['key = ?'], [value]]
  const [query, args] = Object.entries(removeUndefined(encodedRow))
    .filter(([key]) => key !== 'id')
    .reduce(
      ([query, args], [key, value]) => {
        return [
          [...query, `\`${key}\` = ?`],
          [...args, value]
        ]
      },
      [[], []] as [string[], any[]]
    )

  return pipe(
    dbRun(
      `UPDATE ${tableName} SET ${query.join(', ')} WHERE \`id\` = ?`,
      ...args,
      id
    ),
    taskEither.chain(result =>
      pipe(
        result.changes,
        option.fromNullable,
        option.fold(
          () =>
            taskEither.left<RouteError>({
              code: 'DATABASE',
              message: 'Update query did not return changes count'
            }),
          changes =>
            taskEither.right({
              statement: result.stmt,
              changes: changes as NonNegativeInteger
            })
        )
      )
    )
  )
}

export function remove<O extends Record<string, any>>(
  tableName: string,
  where?: Partial<O>
): TaskEither<RouteError, EditResult> {
  let query = `DELETE FROM ${tableName}`
  let args: any[] = []

  if (where && record.size(where)) {
    const whereStatement = Object.keys(where)
      .map(key => `\`${key}\` = ?`)
      .join(' AND ')

    query += ` WHERE ${whereStatement}`
    args = Object.values(where)
  }

  return pipe(
    dbRun(query, ...args),
    taskEither.chain(result =>
      pipe(
        result.changes,
        option.fromNullable,
        option.fold(
          () =>
            taskEither.left<RouteError>({
              code: 'DATABASE',
              message: 'Delete query did not return changes count'
            }),
          changes =>
            taskEither.right({
              statement: result.stmt,
              changes: changes as NonNegativeInteger
            })
        )
      )
    )
  )
}

function removeUndefined<T extends Record<string, any>>(src: T): Partial<T> {
  return Object.entries(src)
    .filter(([, value]) => value !== undefined)
    .reduce((res, [key, value]) => ({ ...res, [key]: value }), {})
}

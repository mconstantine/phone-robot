import { either, option } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { AccountState } from '../contexts/Account/AccountState'

const storageData = {
  account: AccountState
}

const StorageData = t.type(storageData)
type StorageData = t.TypeOf<typeof StorageData>

export function writeStorage<K extends keyof StorageData>(
  key: K,
  data: StorageData[K]
): Either<Error, void> {
  return either.tryCatch(
    () =>
      window.localStorage.setItem(
        key,
        JSON.stringify(storageData[key].encode(data))
      ),
    error => error as Error
  )
}

export function readStorage<K extends keyof StorageData>(
  key: K
): Either<Error, Option<StorageData[K]>> {
  return either.tryCatch(
    () =>
      pipe(
        window.localStorage.getItem(key),
        option.fromNullable,
        option.map(JSON.parse),
        option.fold(
          () => option.none,
          data => pipe(storageData[key].decode(data), option.fromEither)
        )
      ),
    error => error as Error
  )
}

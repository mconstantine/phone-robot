import { array, either, option, record, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { useEffect, useMemo, useState } from 'react'
import { foldAccount, useAccount } from './contexts/Account/Account'
import { AccountAction, AccountState } from './contexts/Account/AccountState'

const ErrorCode = t.keyof(
  {
    UNAUTHORIZED: true,
    FORBIDDEN: true,
    UNKNOWN: true,
    DECODING: true,
    DATABASE: true,
    CONFLICT: true,
    INVALID_INPUT: true,
    NOT_FOUND: true
  },
  'ErrorCode'
)
type ErrorCode = t.TypeOf<typeof ErrorCode>

const RefreshTokenOutput = t.type({
  accessToken: NonEmptyString,
  refreshToken: NonEmptyString,
  expiration: DateFromISOString
})
type RefreshTokenOutput = t.TypeOf<typeof RefreshTokenOutput>

const ApiError = t.type({
  code: ErrorCode,
  message: t.string
})
type ApiError = t.TypeOf<typeof ApiError>

export function suppressedApiError(message: Option<string>): ApiError {
  return {
    code: 'UNKNOWN',
    message: pipe(
      message,
      option.getOrElse(() => '')
    )
  }
}

export function foldApiError<T>(
  matches: Record<ErrorCode, (error: ApiError) => T>
): Reader<ApiError, T> {
  return error => matches[error.code](error)
}

export function foldPartialApiError<T>(
  matches: Partial<Record<ErrorCode, (error: ApiError) => T>>,
  defaultResult: T
): Reader<ApiError, T> {
  return foldApiError(
    pipe(
      ErrorCode.keys,
      record.keys,
      array.reduce(
        {} as Record<ErrorCode, Reader<ApiError, T>>,
        (res, key) => ({ ...res, [key]: matches[key] || (() => defaultResult) })
      )
    )
  )
}

function decodeResponse<O, OO>(
  response: OO,
  codec: t.Type<O, OO>
): TaskEither<ApiError, O> {
  return pipe(
    response,
    codec.decode,
    either.fold(
      () =>
        pipe(
          ApiError.decode(response),
          either.fold(
            () =>
              either.left<ApiError, O>({
                code: 'DECODING',
                message:
                  'Unable to undestrand the server response. Please try again'
              }),
            error => either.left<ApiError, O>(error)
          )
        ),
      res => either.right(res)
    ),
    taskEither.fromEither
  )
}

function useRequest<O, OO>(
  url: string,
  method: 'GET' | 'DELETE',
  outputCodec: t.Type<O, OO>
): ReaderTaskEither<void, ApiError, O>
function useRequest<I, II, O, OO>(
  url: string,
  method: 'POST' | 'PATCH',
  outputCodec: t.Type<O, OO>,
  inputCodec: t.Type<I, II>
): ReaderTaskEither<I, ApiError, O>
function useRequest<I, II, O, OO>(
  url: string,
  method: 'GET' | 'DELETE' | 'POST' | 'PATCH',
  outputCodec: t.Type<O, OO>,
  inputCodec?: t.Type<I, II>
): ReaderTaskEither<I | void, ApiError, O> {
  const { account, dispatchAccountAction } = useAccount()

  const request = useMemo(() => {
    const genericError =
      'An unexpected error occurred during a network request. Please try again'

    const headers = pipe(
      account,
      foldAccount(
        () => ({ 'Content-Type': 'application/json' }),
        account => ({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.accessToken}`
        })
      )
    )

    const doRequest = (body: I | void) =>
      pipe(
        taskEither.tryCatch(
          () =>
            window.fetch(process.env.REACT_APP_API_URL + url, {
              method,
              headers,
              body:
                body && inputCodec
                  ? JSON.stringify(inputCodec.encode(body))
                  : undefined
            }),
          (): ApiError => ({
            code: 'UNKNOWN',
            message: genericError
          })
        ),
        taskEither.chain(response =>
          taskEither.tryCatch(
            () => response.json(),
            (): ApiError => ({
              code: 'DECODING',
              message: genericError
            })
          )
        )
      )

    return (body: I | void) =>
      pipe(
        doRequest(body),
        taskEither.chain(response =>
          pipe(
            response,
            ApiError.decode,
            either.fold(
              () => taskEither.right(response),
              error =>
                pipe(
                  error,
                  foldPartialApiError(
                    {
                      FORBIDDEN: () =>
                        pipe(
                          refreshToken(account, dispatchAccountAction),
                          // taskEither.chain(() => doRequest(body)),
                          taskEither.mapLeft(() => error),
                          taskEither.chain(() => taskEither.left(error)) //
                        )
                    },
                    taskEither.left(error)
                  )
                )
            )
          )
        ),
        taskEither.chain(response => decodeResponse(response, outputCodec))
      )
  }, [account, dispatchAccountAction, inputCodec, method, outputCodec, url])

  return request
}

function refreshToken(
  account: AccountState,
  dispatchAccountAction: Reader<AccountAction, void>
): TaskEither<ApiError, void> {
  return pipe(
    account,
    foldAccount(
      () =>
        taskEither.left<ApiError>({
          code: 'FORBIDDEN',
          message: 'Unable to refresh the token of an anonymous account'
        }),
      account =>
        pipe(
          taskEither.tryCatch(
            () =>
              window.fetch(
                process.env.REACT_APP_API_URL + '/users/refreshToken',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ refreshToken: account.refreshToken })
                }
              ),
            (): ApiError => ({
              code: 'UNKNOWN',
              message: 'Unable to fetch to refresh the token'
            })
          ),
          taskEither.chain(response =>
            taskEither.tryCatch(
              () => response.json(),
              (): ApiError => ({
                code: 'DECODING',
                message: 'Unable to parse refreshToken response to JSON'
              })
            )
          ),
          taskEither.chain(
            flow(
              RefreshTokenOutput.decode,
              either.mapLeft(
                (): ApiError => ({
                  code: 'DECODING',
                  message: 'Unable to decode refreshTokenResponse'
                })
              ),
              taskEither.fromEither
            )
          ),
          taskEither.chain(account =>
            taskEither.fromIO(() =>
              dispatchAccountAction({
                type: 'RefreshToken',
                ...account
              })
            )
          )
        )
    )
  )
}

interface ApiCallNoBody<O, OO> {
  url: string
  outputCodec: t.Type<O, OO>
}

interface ApiCall<I, II, O, OO> {
  url: string
  inputCodec: t.Type<I, II>
  outputCodec: t.Type<O, OO>
}

export function apiCall<O, OO>(
  url: string,
  outputCodec: t.Type<O, OO>
): ApiCallNoBody<O, OO>
export function apiCall<I, II, O, OO>(
  url: string,
  outputCodec: t.Type<O, OO>,
  inputCodec: t.Type<I, II>
): ApiCall<I, II, O, OO>
export function apiCall<I, II, O, OO>(
  url: string,
  outputCodec: t.Type<O, OO>,
  inputCodec?: t.Type<I, II>
): ApiCallNoBody<O, OO> | ApiCall<I, II, O, OO> {
  return {
    url,
    inputCodec,
    outputCodec
  }
}

export function usePost<I, II, O, OO>(
  apiCall: ApiCall<I, II, O, OO>
): ReaderTaskEither<I, ApiError, O> {
  const request = useRequest(
    apiCall.url,
    'POST',
    apiCall.outputCodec,
    apiCall.inputCodec
  )

  return request
}

export function usePatch<I, II, O, OO>(
  apiCall: ApiCall<I, II, O, OO>
): ReaderTaskEither<I, ApiError, O> {
  const request = useRequest(
    apiCall.url,
    'PATCH',
    apiCall.outputCodec,
    apiCall.inputCodec
  )

  return request
}

export function useDelete<O, OO>(
  apiCall: ApiCallNoBody<O, OO>
): ReaderTaskEither<void, ApiError, O> {
  const request = useRequest(apiCall.url, 'DELETE', apiCall.outputCodec)

  return request
}

interface LoadingRemoteData {
  type: 'Loading'
}

interface ErrorRemoteData {
  type: 'Error'
  error: ApiError
}

interface SuccessRemoteData<O> {
  type: 'Success'
  data: O
}

type RemoteData<O> = LoadingRemoteData | ErrorRemoteData | SuccessRemoteData<O>

export function foldRemoteData<O, T>(
  whenLoading: IO<T>,
  whenError: Reader<ApiError, T>,
  whenSuccess: Reader<O, T>
): Reader<RemoteData<O>, T> {
  return remoteData => {
    switch (remoteData.type) {
      case 'Loading':
        return whenLoading()
      case 'Error':
        return whenError(remoteData.error)
      case 'Success':
        return whenSuccess(remoteData.data)
    }
  }
}

export function useGet<O, OO>(
  apiCall: ApiCallNoBody<O, OO>
): [RemoteData<O>, IO<void>] {
  const request = useRequest(apiCall.url, 'GET', apiCall.outputCodec)

  const [remoteData, setRemoteData] = useState<RemoteData<O>>({
    type: 'Loading'
  })

  const refresh = () => {
    setRemoteData({ type: 'Loading' })

    const doRequest = pipe(
      request(),
      taskEither.bimap(
        error =>
          setRemoteData({
            type: 'Error',
            error
          }),
        data =>
          setRemoteData({
            type: 'Success',
            data
          })
      )
    )

    doRequest()
  }

  useEffect(refresh, [apiCall, request])

  return [remoteData, refresh]
}

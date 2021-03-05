import { array, either, option, record, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'

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

function request<O, OO>(
  url: string,
  method: 'GET' | 'DELETE',
  outputCodec: t.Type<O, OO>
): TaskEither<ApiError, O>
function request<I, II, O, OO>(
  url: string,
  method: 'POST' | 'PATCH',
  outputCodec: t.Type<O, OO>,
  body: I,
  inputCodec: t.Type<I, II>
): TaskEither<ApiError, O>
function request<I, II, O, OO>(
  url: string,
  method: 'GET' | 'DELETE' | 'POST' | 'PATCH',
  outputCodec: t.Type<O, OO>,
  body?: I,
  inputCodec?: t.Type<I, II>
): TaskEither<ApiError, O> {
  const genericError =
    'An unexpected error occurred during a network request. Please try again'

  return pipe(
    taskEither.tryCatch(
      () =>
        window.fetch(process.env.REACT_APP_API_URL + url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
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
    ),
    taskEither.chain(response => decodeResponse(response, outputCodec))
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

export function useGet<O, OO>(
  apiCall: ApiCallNoBody<O, OO>
): TaskEither<ApiError, O> {
  return request(apiCall.url, 'GET', apiCall.outputCodec)
}

export function usePost<I, II, O, OO>(
  apiCall: ApiCall<I, II, O, OO>
): ReaderTaskEither<I, ApiError, O> {
  return input =>
    request(apiCall.url, 'POST', apiCall.outputCodec, input, apiCall.inputCodec)
}

export function usePatch<I, II, O, OO>(
  apiCall: ApiCall<I, II, O, OO>
): ReaderTaskEither<I, ApiError, O> {
  return input =>
    request(
      apiCall.url,
      'PATCH',
      apiCall.outputCodec,
      input,
      apiCall.inputCodec
    )
}

export function useDelete<O, OO>(
  apiCall: ApiCallNoBody<O, OO>
): ReaderTaskEither<void, ApiError, O> {
  return () => request(apiCall.url, 'DELETE', apiCall.outputCodec)
}
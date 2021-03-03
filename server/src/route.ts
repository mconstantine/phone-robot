import { Request, Response } from 'express'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as t from 'io-ts'
import { either, taskEither } from 'fp-ts'
import { getDecodeErrors } from './lib/codecs'

const ErrorCode = t.keyof(
  {
    UNAUTHORIZED: true,
    FORBIDDEN: true,
    UNKNOWN: true,
    DECODING: true,
    DATABASE: true,
    CONFLICT: true,
    INVALID_INPUT: true
  },
  'ErrorCode'
)
export type ErrorCode = t.TypeOf<typeof ErrorCode>

export interface RouteError {
  code: ErrorCode
  message: string
  error?: Error
}

function foldRouterError<T>(
  whenUnauthorized: (error: RouteError) => T,
  whenForbidden: (error: RouteError) => T,
  whenUnknown: (error: RouteError) => T,
  whenDecoding: (error: RouteError) => T,
  whenDatabase: (error: RouteError) => T,
  whenConflict: (error: RouteError) => T,
  whenInvalidInput: (error: RouteError) => T
): (error: RouteError) => T {
  return error => {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return whenUnauthorized(error)
      case 'FORBIDDEN':
        return whenForbidden(error)
      case 'UNKNOWN':
        return whenUnknown(error)
      case 'DECODING':
        return whenDecoding(error)
      case 'DATABASE':
        return whenDatabase(error)
      case 'CONFLICT':
        return whenConflict(error)
      case 'INVALID_INPUT':
        return whenInvalidInput(error)
    }
  }
}

export function createdRouteResponse<O>(result: O): RouteResponse<O> {
  return {
    status: 201,
    result
  }
}

export function okRouteResponse<O>(result: O): RouteResponse<O> {
  return {
    status: 200,
    result
  }
}

export interface RouteResponse<O> {
  status: number
  result: O
}

export function makeRoute<I, II, O, OO>(
  inputCodec: t.Type<I, II>,
  outputCodec: t.Type<O, OO>,
  handler: ReaderTaskEither<I, RouteError, RouteResponse<O>>
): (request: Request, response: Response) => void {
  return (req, res) => {
    const handleRequest = pipe(
      req.body,
      inputCodec.decode,
      either.mapLeft<t.Errors, RouteError>(errors => ({
        code: 'DECODING',
        message: getDecodeErrors(errors)
      })),
      taskEither.fromEither,
      taskEither.chain(handler),
      taskEither.bimap(
        error => {
          error.error && console.log(error.error)

          pipe(
            error,
            foldRouterError(
              error => res.status(401).json(error),
              error => res.status(403).json(error),
              error => res.status(500).json(error),
              error => res.status(400).json(error),
              error => res.status(500).json(error),
              error => res.status(409).json(error),
              error => res.status(400).json(error)
            )
          )
        },
        response =>
          res.status(response.status).json(outputCodec.encode(response.result))
      )
    )

    handleRequest()
  }
}

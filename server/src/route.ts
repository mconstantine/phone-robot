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
    INVALID_INPUT: true,
    NOT_FOUND: true
  },
  'ErrorCode'
)
export type ErrorCode = t.TypeOf<typeof ErrorCode>

export interface RouteError {
  code: ErrorCode
  message: string
  error?: Error
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

          switch (error.code) {
            case 'UNAUTHORIZED':
              return res.status(401).json(error)
            case 'FORBIDDEN':
              return res.status(403).json(error)
            case 'UNKNOWN':
              return res.status(500).json(error)
            case 'DECODING':
              return res.status(400).json(error)
            case 'DATABASE':
              return res.status(500).json(error)
            case 'CONFLICT':
              return res.status(409).json(error)
            case 'INVALID_INPUT':
              return res.status(400).json(error)
            case 'NOT_FOUND':
              return res.status(404).json(error)
          }
        },
        response =>
          res.status(response.status).json(outputCodec.encode(response.result))
      )
    )

    handleRequest()
  }
}

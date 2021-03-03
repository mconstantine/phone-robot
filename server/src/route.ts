import { Request, Response } from 'express'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as t from 'io-ts'
import { either, taskEither } from 'fp-ts'
import { getDecodeErrors } from './lib/codecs'
import { sequenceS } from 'fp-ts/Apply'
import { getUserById, User } from './user/userDatabase'
import { verifyToken } from './lib/jsonwebtoken'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { Reader } from 'fp-ts/Reader'

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

export interface HandlerInput<I, P = unknown> {
  body: I
  params: P
}

export interface HandlerInputWithAuth<I, P = unknown> {
  body: I
  params: P
  currentUser: User
}

export function makeRoute<I, II, O, OO, P, PP>(
  inputCodec: t.Type<I, II>,
  outputCodec: t.Type<O, OO>,
  paramsCodec: t.Type<P, PP>,
  handler: ReaderTaskEither<HandlerInput<I, P>, RouteError, RouteResponse<O>>,
  requireAuthentication: false
): (request: Request, response: Response) => void
export function makeRoute<I, II, O, OO, P, PP>(
  inputCodec: t.Type<I, II>,
  outputCodec: t.Type<O, OO>,
  paramsCodec: t.Type<P, PP>,
  handler: ReaderTaskEither<
    HandlerInputWithAuth<I, P>,
    RouteError,
    RouteResponse<O>
  >
): (request: Request, response: Response) => void
export function makeRoute<I, II, O, OO, P, PP>(
  inputCodec: t.Type<I, II>,
  outputCodec: t.Type<O, OO>,
  paramsCodec: t.Type<P, PP>,
  handler:
    | ReaderTaskEither<HandlerInputWithAuth<I, P>, RouteError, RouteResponse<O>>
    | ReaderTaskEither<HandlerInput<I, P>, RouteError, RouteResponse<O>>,
  requireAuthentication = true
): (request: Request, response: Response) => void {
  return (req, res) => {
    const handleError: Reader<RouteError, void> = error => {
      const publicError = {
        code: error.code,
        message: error.message
      }

      error.error && console.log(error.error)

      switch (error.code) {
        case 'UNAUTHORIZED':
          return res.status(401).json(publicError)
        case 'FORBIDDEN':
          return res.status(403).json(publicError)
        case 'UNKNOWN':
          return res.status(500).json(publicError)
        case 'DECODING':
          return res.status(400).json(publicError)
        case 'DATABASE':
          return res.status(500).json(publicError)
        case 'CONFLICT':
          return res.status(409).json(publicError)
        case 'INVALID_INPUT':
          return res.status(400).json(publicError)
        case 'NOT_FOUND':
          return res.status(404).json(publicError)
      }
    }

    const handleResponse: Reader<RouteResponse<O>, void> = response =>
      res.status(response.status).json(outputCodec.encode(response.result))

    const decodeInput: ReaderTaskEither<
      Request,
      RouteError,
      HandlerInput<I, P>
    > = req =>
      pipe(
        {
          body: inputCodec.decode(req.body),
          params: paramsCodec.decode(req.params)
        },
        sequenceS(either.either),
        either.mapLeft<t.Errors, RouteError>(errors => ({
          code: 'DECODING',
          message: getDecodeErrors(errors)
        })),
        taskEither.fromEither
      )

    const decodeInputWithAuth: ReaderTaskEither<
      Request,
      RouteError,
      HandlerInputWithAuth<I, P>
    > = req =>
      pipe(
        authenticateUser(req),
        taskEither.chain(currentUser =>
          pipe(
            decodeInput(req),
            taskEither.map(input => ({
              ...input,
              currentUser
            }))
          )
        )
      )

    if (requireAuthentication === false) {
      const handleRequest = pipe(
        decodeInput(req),
        taskEither.chain(
          handler as ReaderTaskEither<
            HandlerInput<I, P>,
            RouteError,
            RouteResponse<O>
          >
        ),
        taskEither.bimap(handleError, handleResponse)
      )

      return handleRequest()
    } else {
      const handleRequest = pipe(
        decodeInputWithAuth(req),
        taskEither.chain(handler),
        taskEither.bimap(handleError, handleResponse)
      )

      return handleRequest()
    }
  }
}

function authenticateUser(req: Request): TaskEither<RouteError, User> {
  const authorization = req.headers.authorization
  const error: RouteError = {
    code: 'UNAUTHORIZED',
    message: 'Your authorization credentials are invalid'
  }

  return pipe(
    authorization || '',
    authorization => authorization.substring(7),
    NonEmptyString.decode,
    either.mapLeft(() => error),
    either.chain(token => verifyToken(token, 'USER_ACCESS')),
    taskEither.fromEither,
    taskEither.chain(id => getUserById(id)),
    taskEither.chain(taskEither.fromOption<RouteError>(() => error))
  )
}

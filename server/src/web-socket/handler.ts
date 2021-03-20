import { boolean, either, option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import WebSocket from 'ws'
import { verifyToken } from '../lib/jsonwebtoken'
import { getUserById } from '../user/userDatabase'
import {
  AuthorizationMessage,
  Message,
  RefusalReason,
  Response
} from './domain'
import { State, updateState } from './state'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { IO } from 'fp-ts/IO'
import { Action } from './state'

export abstract class WebSocketHandler {
  protected socket: Option<WebSocket> = option.none
  protected state: State = { type: 'Idle' }
  protected onPeerDisconnected: IO<void>

  public constructor(onPeerDisconnected: IO<void>) {
    this.onPeerDisconnected = onPeerDisconnected
  }

  protected updateState(action: Action) {
    this.state = updateState(this.state, action)
  }

  protected sendResponse(response: Response) {
    console.log(response)

    pipe(
      this.socket,
      option.fold(constVoid, client =>
        client.send(pipe(response, Response.encode, JSON.stringify))
      )
    )
  }

  public abstract authorize(
    socket: WebSocket,
    message: Message
  ): TaskEither<void, WebSocket>

  protected abstract reset(): void

  public isConnected(): boolean {
    return option.isSome(this.socket)
  }

  public signalPeerConnected(): void {
    this.updateState({
      type: 'PeerConnected'
    })

    this.sendResponse({
      type: 'PeerConnected'
    })
  }

  public signalPeerDisconnected(): void {
    this.updateState({
      type: 'PeerDisconnected'
    })

    this.sendResponse({
      type: 'PeerDisconnected'
    })
  }
}

export class WebSocketClientHandler extends WebSocketHandler {
  public authorize(socket: WebSocket, message: AuthorizationMessage) {
    const sendRefusal = (reason: RefusalReason, message: string) =>
      socket.send(
        pipe(
          { type: 'Refused', reason, message },
          Response.encode,
          JSON.stringify
        )
      )

    const authorize = () =>
      pipe(
        verifyToken(message.accessToken, 'USER_ACCESS'),
        either.orElse(error => {
          sendRefusal('Forbidden', 'Your login cradentials are invalid')
          return either.left(error)
        }),
        taskEither.fromEither,
        taskEither.chain(getUserById),
        taskEither.mapLeft(constVoid),
        taskEither.chain(taskEither.fromOption(constVoid)),
        taskEither.chain(() =>
          taskEither.rightIO(() => {
            this.socket = option.some(socket)
            this.sendResponse({ type: 'Authorized' })
            this.updateState(message)
            socket.on('close', () => this.reset())

            return socket
          })
        )
      )

    const refuse = () =>
      taskEither.leftIO(() =>
        sendRefusal('ConnectionBusy', 'Someone else is already connected')
      )

    return pipe(this.socket, option.fold(authorize, refuse))
  }

  public reset() {
    console.log('Client is out')

    this.onPeerDisconnected()
    this.updateState({
      type: 'Reset'
    })

    pipe(
      this.socket,
      option.fold(constVoid, socket => {
        socket.close()
        this.socket = option.none
      })
    )
  }
}

export class WebSocketRobotHandler extends WebSocketHandler {
  private isRobotAlive: boolean = false
  private pingInterval: Option<NodeJS.Timeout> = option.none
  private pingTimeout: Option<NodeJS.Timeout> = option.none

  public authorize(socket: WebSocket, message: AuthorizationMessage) {
    const authorize = () =>
      pipe(
        message.accessToken === process.env.ROBOT_SECRET,
        boolean.fold(
          () => taskEither.leftIO(constVoid),
          () =>
            taskEither.rightIO(() => {
              this.socket = option.some(socket)
              this.sendResponse({ type: 'Authorized' })
              this.updateState(message)
              this.startPinging()
              socket.on('close', () => this.reset())

              return socket
            })
        )
      )

    const refuse = () =>
      taskEither.leftIO(() => {
        socket.send(
          pipe(
            {
              type: 'Refused',
              reason: 'ConnectionBusy',
              message: 'Someone else is already connected'
            },
            Response.encode,
            JSON.stringify
          )
        )
      })

    return pipe(this.socket, option.fold(authorize, refuse))
  }

  public reset() {
    console.log('Robot is out')

    this.onPeerDisconnected()
    this.updateState({
      type: 'Reset'
    })

    pipe(this.pingInterval, option.fold(constVoid, clearInterval))
    pipe(this.pingTimeout, option.fold(constVoid, clearTimeout))

    pipe(
      this.socket,
      option.fold(constVoid, socket => {
        socket.close()
        this.socket = option.none
      })
    )
  }

  private startPinging() {
    pipe(
      this.socket,
      option.fold(
        () => console.error('Trying to start pinging without a socket'),
        socket => {
          socket.on('pong', () => {
            this.isRobotAlive = true
          })

          this.pingInterval = option.some(
            setInterval(() => this.pingRobot(), 30000)
          )
        }
      )
    )
  }

  private pingRobot() {
    pipe(
      this.socket,
      option.fold(
        () => console.error('Trying to ping without a socket'),
        socket => {
          this.isRobotAlive = false
          socket.ping()

          this.pingTimeout = option.some(
            setTimeout(() => this.checkRobot(), 10000)
          )
        }
      )
    )
  }

  private checkRobot() {
    pipe(
      this.socket,
      option.fold(
        () => console.error('Trying to check robot without a socket'),
        socket => {
          if (!this.isRobotAlive) {
            socket.close()
          }
        }
      )
    )
  }
}

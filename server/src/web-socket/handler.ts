import { boolean, option, task, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import WebSocket from 'ws'
import { verifyToken } from '../lib/jsonwebtoken'
import { getUserById } from '../user/userDatabase'
import { AuthorizationMessage, Message, Response } from './domain'
import { State, updateState } from './state'
import { Task } from 'fp-ts/Task'

export abstract class WebSocketHandler {
  protected socket: Option<WebSocket> = option.none
  protected state: State = { type: 'Idle' }

  protected updateState(message: Message) {
    this.state = updateState(this.state, message)
  }

  protected sendResponse(response: Response) {
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
  ): Task<Option<WebSocket>>

  public abstract reset(): void
}

export class WebSocketClientHandler extends WebSocketHandler {
  authorize(socket: WebSocket, message: AuthorizationMessage) {
    const authorize = () =>
      pipe(
        verifyToken(message.accessToken, 'USER_ACCESS'),
        taskEither.fromEither,
        taskEither.chain(getUserById),
        taskEither.mapLeft(constVoid),
        taskEither.chain(taskEither.fromOption(constVoid)),
        taskEither.chain(() =>
          taskEither.fromIO(() => {
            this.socket = option.some(socket)
            this.sendResponse({ type: 'Authorized' })
            this.updateState(message)
            socket.on('close', () => this.reset())

            return this.socket
          })
        ),
        taskEither.getOrElse(() =>
          task.fromIO<Option<WebSocket>>(() => option.none)
        )
      )

    const refuse = () =>
      task.fromIO(() => {
        socket.send(
          pipe(
            {
              type: 'Refused',
              reason: 'Someone else is already connected'
            },
            Response.encode,
            JSON.stringify
          )
        )

        return option.none
      })

    return pipe(this.socket, option.fold(authorize, refuse))
  }

  reset() {
    this.updateState({ type: 'Reset', from: 'UI' })

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

  authorize(socket: WebSocket, message: AuthorizationMessage) {
    const authorize = () =>
      pipe(
        message.accessToken === process.env.ROBOT_SECRET,
        boolean.fold(
          () => task.fromIO(() => option.none),
          () =>
            task.fromIO(() => {
              this.socket = option.some(socket)
              this.sendResponse({ type: 'Authorized' })
              this.updateState(message)
              this.startPinging()
              socket.on('close', () => this.reset())

              return this.socket
            })
        )
      )

    const refuse = () =>
      task.fromIO(() => {
        socket.send(
          pipe(
            {
              type: 'Refused',
              reason: 'Someone else is already connected'
            },
            Response.encode,
            JSON.stringify
          )
        )

        return option.none
      })

    return pipe(this.socket, option.fold(authorize, refuse))
  }

  reset() {
    this.updateState({ type: 'Reset', from: 'Robot' })
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

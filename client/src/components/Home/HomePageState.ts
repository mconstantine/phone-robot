import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { Response } from './domain'

interface InitialState {
  type: 'Initial'
}

interface AuthorizedState {
  type: 'Authorized'
}

export type HomePageState = InitialState | AuthorizedState

export function foldHomePageState<T>(
  whenInitial: IO<T>,
  whenAuthorized: Reader<AuthorizedState, T>
): Reader<HomePageState, T> {
  return state => {
    switch (state.type) {
      case 'Initial':
        return whenInitial()
      case 'Authorized':
        return whenAuthorized(state)
    }
  }
}

export function homePageReducer(
  state: HomePageState,
  response: Response
): HomePageState {
  switch (state.type) {
    case 'Initial':
      switch (response.type) {
        case 'Authorized':
          return {
            type: 'Authorized'
          }
      }
    case 'Authorized':
      switch (response.type) {
        case 'Authorized':
          return state
      }
  }
}

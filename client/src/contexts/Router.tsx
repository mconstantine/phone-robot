import { end, format, lit, parse, Route, zero } from 'fp-ts-routing'
import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { createContext, useContext, useEffect, useState } from 'react'

interface Home {
  readonly _tag: 'Home'
}

interface Profile {
  readonly _tag: 'Profile'
}

interface Users {
  readonly _tag: 'Users'
}

export type Location = Home | Profile | Users

export function home(): Location {
  return {
    _tag: 'Home'
  }
}

export function profile(): Location {
  return {
    _tag: 'Profile'
  }
}

export function users(): Location {
  return {
    _tag: 'Users'
  }
}

export function foldLocation<T>(
  matches: {
    [K in Location['_tag']]: (
      args: Omit<Extract<Location, { _tag: K }>, '_tag'>
    ) => T
  }
): (location: Location) => T {
  return location => matches[location._tag](location)
}

const homeMatch = end
const profileMatch = lit('profile').then(end)
const usersMatch = lit('users').then(end)

const router = zero<Location>()
  .alt(homeMatch.parser.map(home))
  .alt(profileMatch.parser.map(profile))
  .alt(usersMatch.parser.map(users))

interface Props {
  render: Reader<Location, JSX.Element>
}

function parseCurrentPath() {
  return parse(router, Route.parse(window.location.pathname), home())
}

function formatLocation(location: Location): string {
  return format(
    pipe(
      location,
      foldLocation({
        Home: () => homeMatch.formatter,
        Profile: () => profileMatch.formatter,
        Users: () => usersMatch.formatter
      })
    ),
    location
  )
}

interface LocationContext {
  location: Location
  setLocation: Reader<Location, void>
}

const LocationContext = createContext<LocationContext>({
  location: home(),
  setLocation: constVoid
})

export function useRouter(): LocationContext {
  const { location, setLocation } = useContext(LocationContext)

  const setLocationAndUpdateHistory = (location: Location) => {
    setLocation(location)
    window.history.pushState(null, '', formatLocation(location))
  }

  return {
    location,
    setLocation: setLocationAndUpdateHistory
  }
}

export function Router(props: Props) {
  const [location, setLocation] = useState(parseCurrentPath())

  useEffect(() => {
    const onRouteChange = () => {
      setLocation(parseCurrentPath())
    }

    window.addEventListener('popstate', onRouteChange)

    return () => {
      window.removeEventListener('popstate', onRouteChange)
    }
  }, [])

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {props.render(location)}
    </LocationContext.Provider>
  )
}

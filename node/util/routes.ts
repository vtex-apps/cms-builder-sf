import { readJson } from 'fs-extra'

import InvalidRoutes from '../errors/invalidRoutes'
import RouteNotFound from '../errors/routeNotFound'

interface PagePath {
  path: string
}

interface PageRoute {
  [key: string]: PagePath
}

export interface Routes {
  routes: PageRoute[]
}

export function makeRoutes(key: string, path: string) {
  const pagePath: PagePath = { path }
  const pageRoute: PageRoute = { [key]: pagePath }
  const routes: Routes = { routes: [pageRoute] }

  return routes
}

export function makeEmptyRoutes() {
  const routes: Routes = { routes: [] }

  return routes
}

export function addRoute(routes: Routes, key: string, path: string) {
  const newPagePath: PagePath = { path }
  const newPageRoute: PageRoute = { [key]: newPagePath }

  routes.routes.push(newPageRoute)

  return routes
}

export function doesRouteExist(routes: Routes, page: string) {
  for (const element of routes.routes) {
    const [currentPage] = Object.keys(element)

    if (currentPage === page) {
      return true
    }
  }

  return false
}

export function updateRoutes(routes: Routes, key: string, path: string) {
  routes.routes.forEach(pageRoute => {
    const [currentPage] = Object.keys(pageRoute)

    if (currentPage === key) {
      const index = routes.routes.indexOf(pageRoute)
      const newPagePath: PagePath = { path }
      const newPageRoute: PageRoute = { [key]: newPagePath }

      routes.routes[index] = newPageRoute
    }
  })

  return routes
}

export function getRouteJSON(routes: Routes) {
  if (routes.routes.length === 0) {
    return '{}'
  }

  let json = '{'

  // tslint:disable-next-line:forin
  for (const element of routes.routes) {
    let pageRoute = JSON.stringify(element)

    pageRoute = pageRoute.substring(1, pageRoute.length - 1)
    json = `${json} ${pageRoute},`
  }

  json = `${json.substring(0, json.length - 1)}}`

  return json
}

export function removeRoute(routes: Routes, key: string) {
  // tslint:disable-next-line:forin
  for (const pageRoute of routes.routes) {
    const [currentKey] = Object.keys(element)

    if (currentKey === key) {
      const index = routes.routes.indexOf(pageRoute)

      routes.routes.splice(index, 1)

      return routes
    }
  }

  throw new RouteNotFound(`Could not find the route of the page ${key}`)
}

export async function parseRoutes(path: string) {
  const routes = makeEmptyRoutes()

  try {
    const readjson = await readJson(path)
    const jsonString = JSON.stringify(readjson)
    const newjson = `[${jsonString}]`
    const parsedJson = JSON.parse(newjson)

    // tslint:disable-next-line:forin
    for (const elements of parsedJson) {
      for (const [key, value] of Object.entries(elements)) {
        const pagePath = value as PagePath
        const pageRoute: PageRoute = { [key]: pagePath }

        routes.routes.push(pageRoute)
      }
    }
  } catch (error) {
    console.error(error)
    throw new InvalidRoutes("routes.json doesn't exist or is malformed.")
  }

  return routes
}

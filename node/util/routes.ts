interface PagePath {
  path: string
}

interface PageRoute {
  [key: string]: PagePath
}

export interface Routes {
  routes: PageRoute[]
}

export function makeRoutes(key: string, path: string){
  const pagePath: PagePath = {path}
  const pageRoute: PageRoute = { [key] : pagePath }
  const routes: Routes = {routes: [pageRoute]}
  return routes
}

export function addRoute(routes: Routes, key: string, path: string){
  const newPagePath: PagePath = {path}
  const newPageRoute: {[key: string]: PagePath} = { [key] : newPagePath }
  routes.routes.push(newPageRoute)
  return routes
}

export function getRouteJSON(routes: Routes){
  let json = JSON.stringify(routes.routes)
  json = json.replace('[', '')
  json = json.replace(']', '')
  return json
}

export function removeRoute(routes: Routes, key: string){
  // tslint:disable-next-line:forin
  for (const pageRoute of routes.routes) {
    const currentKey = Object.keys(pageRoute)[0]
    if(currentKey === key) {
      const index = routes.routes.indexOf(pageRoute)
      routes.routes.splice(index, 1)
      return {success: true, routes}
    }
  }
  return {success: false, routes}
}

const TEN_SECONDS_S = 10

export function methodNotAllowed(ctx: Context) {
  ctx.status = 405
  ctx.set('cache-control', `public, max-age=${TEN_SECONDS_S}`)
}

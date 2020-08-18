interface Options {
  message: string
  code: string
  ctx: Context
  next: () => Promise<any>
}

export async function returnResponseError({
  message,
  code,
  ctx,
  next,
}: Options) {
  ctx.status = 404
  ctx.body = `{"message": "${message}", "code": "${code}"}`
  await next()
}

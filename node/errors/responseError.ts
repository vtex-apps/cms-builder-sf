export async function returnResponseError(message: string, code: string, ctx: Context, next: () => Promise<any>){
  ctx.status = 404
  ctx.body = `{"message": "${message}", "code": "${code}"}`
  await next()
}

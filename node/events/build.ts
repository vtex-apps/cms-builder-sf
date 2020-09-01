export async function build(ctx: Context, next: () => Promise<void>) {
  console.log('called the build function')

  next()
}

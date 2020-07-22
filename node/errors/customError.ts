export default abstract class CustomError extends Error {
  public abstract code: string
  public abstract status: number
}

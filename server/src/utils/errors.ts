export class AppError extends Error {
  public statusCode: number;
  public payload?: unknown;

  constructor(message: string, statusCode = 400, payload?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.payload = payload;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

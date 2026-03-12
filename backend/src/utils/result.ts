/**
 * Generic Result pattern implementation to handle operation outcomes.
 * Promotes functional error handling by avoiding unnecessary try-catch blocks.
 */
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: string | null;
  private readonly _value: T | null;

  /**
   * Private constructor to enforce the use of static factory methods (ok, fail).
   */
  private constructor(isSuccess: boolean, error: string | null, value: T | null) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;
    Object.freeze(this); // Ensures immutability of the result object
  }

  /**
   * Returns the encapsulated value. 
   * @throws Error if the result is a failure.
   */
  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Execution Error: ${this.error}`);
    }
    return this._value as T;
  }

  /**
   * Creates a successful Result instance.
   * @param value The successful data payload.
   */
  public static ok<U>(value: U): Result<U> {
    return new Result<U>(true, null, value);
  }

  /**
   * Creates a failed Result instance.
   * @param error Descriptive error message in English.
   */
  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error, null);
  }
}
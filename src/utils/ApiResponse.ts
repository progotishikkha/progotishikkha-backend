export class ApiResponse<T = unknown> {
  public success: true;
  public statusCode: number;
  public message: string;
  public data: T;

  constructor(statusCode: number, data: T, message = "Success") {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export class NewsFetchError extends Error {
  status = 500;

  constructor(message: string = "Failed to fetch news") {
    super(message);
    this.name = "NewsFetchError";
  }
}

export class ValidationError extends Error {
  status = 400;

  constructor(message: string = "Validation error") {
    super(message);
    this.name = "ValidationError";
  }
}

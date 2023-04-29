class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); //add a "message" prop to instances created based on Error
    this.code = errorCode;
  }
}

module.exports = HttpError;

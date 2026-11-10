class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class UnauthorizedApiException extends ApiException {
  const UnauthorizedApiException([
    String message = 'Session expired. Please sign in again.',
  ]) : super(message, statusCode: 401);
}

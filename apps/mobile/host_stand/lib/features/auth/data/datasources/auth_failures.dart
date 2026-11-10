class InvalidCredentialsFailure implements Exception {
  const InvalidCredentialsFailure();
}

class InvalidInputFailure implements Exception {
  const InvalidInputFailure(this.message);
  final String message;
}

class NetworkFailure implements Exception {
  const NetworkFailure();
}

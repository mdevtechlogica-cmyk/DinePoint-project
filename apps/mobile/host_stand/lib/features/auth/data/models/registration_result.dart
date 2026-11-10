import 'package:equatable/equatable.dart';

class RegistrationResult extends Equatable {
  const RegistrationResult({
    required this.accountId,
    required this.ownerName,
    required this.email,
    required this.organizationName,
    required this.createdAt,
  });

  final String accountId;
  final String ownerName;
  final String email;
  final String organizationName;
  final DateTime createdAt;

  factory RegistrationResult.fromJson(Map<String, dynamic> json) =>
      RegistrationResult(
        accountId: json['accountId'] as String,
        ownerName: json['ownerName'] as String,
        email: json['email'] as String,
        organizationName: json['organizationName'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  Map<String, dynamic> toJson() => {
    'accountId': accountId,
    'ownerName': ownerName,
    'email': email,
    'organizationName': organizationName,
    'createdAt': createdAt.toIso8601String(),
  };

  @override
  List<Object?> get props => [accountId, ownerName, email, organizationName, createdAt];
}

class EmailAlreadyUsedException implements Exception {
  const EmailAlreadyUsedException();
}

class RegistrationInputException implements Exception {
  const RegistrationInputException(this.message);
  final String message;
}

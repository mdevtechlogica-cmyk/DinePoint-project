import 'package:equatable/equatable.dart';

class FaqItem extends Equatable {
  final String question, answer;
  const FaqItem(this.question, this.answer);
  @override
  List<Object?> get props => [question, answer];
}

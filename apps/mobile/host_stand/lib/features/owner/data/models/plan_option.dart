import 'package:equatable/equatable.dart';

class PlanOption extends Equatable {
  final String name, price, outletLimit, tableLimit, features;
  final bool recommended;
  const PlanOption(
      {required this.name,
      required this.price,
      required this.outletLimit,
      required this.tableLimit,
      required this.features,
      this.recommended = false});
  @override
  List<Object?> get props =>
      [name, price, outletLimit, tableLimit, features, recommended];
}

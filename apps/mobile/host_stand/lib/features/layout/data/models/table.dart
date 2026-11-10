import 'package:equatable/equatable.dart';

class TableModel extends Equatable {
  const TableModel(
      {required this.id,
      required this.number,
      required this.seats,
      required this.ac,
      required this.family,
      required this.active});
  final String id;
  final int number, seats;
  final bool ac, family, active;
  TableModel copyWith(
          {int? number, int? seats, bool? ac, bool? family, bool? active}) =>
      TableModel(
          id: id,
          number: number ?? this.number,
          seats: seats ?? this.seats,
          ac: ac ?? this.ac,
          family: family ?? this.family,
          active: active ?? this.active);
  @override
  List<Object?> get props => [id, number, seats, ac, family, active];
}

import 'package:equatable/equatable.dart';

class TableDraft extends Equatable {
  const TableDraft(
      {this.id,
      this.numberText = '',
      this.seats = 0,
      this.ac = true,
      this.family = false,
      this.active = true});
  final String? id;
  final String numberText;
  final int seats;
  final bool ac, family, active;
  bool get isEdit => id != null;
  TableDraft copyWith(
          {String? numberText,
          int? seats,
          bool? ac,
          bool? family,
          bool? active}) =>
      TableDraft(
          id: id,
          numberText: numberText ?? this.numberText,
          seats: seats ?? this.seats,
          ac: ac ?? this.ac,
          family: family ?? this.family,
          active: active ?? this.active);
  @override
  List<Object?> get props => [id, numberText, seats, ac, family, active];
}

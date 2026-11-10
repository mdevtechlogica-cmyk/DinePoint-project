import 'package:equatable/equatable.dart';
import 'package:host_stand/features/layout/data/models/table.dart';

class RoomModel extends Equatable {
  const RoomModel(
      {required this.id,
      required this.name,
      required this.active,
      required this.tables});
  final String id, name;
  final bool active;
  final List<TableModel> tables;
  RoomModel copyWith({String? name, bool? active, List<TableModel>? tables}) =>
      RoomModel(
          id: id,
          name: name ?? this.name,
          active: active ?? this.active,
          tables: tables ?? this.tables);
  @override
  List<Object?> get props => [id, name, active, tables];
}

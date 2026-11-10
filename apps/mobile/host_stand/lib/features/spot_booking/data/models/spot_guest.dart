import 'package:equatable/equatable.dart';

class SpotGuest extends Equatable {
  const SpotGuest({required this.name, required this.phone, this.note = ''});
  final String name, phone, note;
  factory SpotGuest.fromJson(Map<String, dynamic> j) =>
      SpotGuest(name: j['name'], phone: j['phone'], note: j['note'] ?? '');
  Map<String, dynamic> toJson() => {'name': name, 'phone': phone, 'note': note};
  @override
  List<Object?> get props => [name, phone, note];
}

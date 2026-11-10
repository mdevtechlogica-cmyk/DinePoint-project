import 'package:equatable/equatable.dart';

class PlanInfo extends Equatable {
  final String name, status, renewalText;
  final int outlets, tables, floors, rooms, reportDays, smsPerMonth, whatsappPerMonth;
  final bool adsEnabled, reportsEnabled, employeesEnabled, exportReports;
  final int usedOutlets, usedTables, usedSms, usedWhatsapp;

  const PlanInfo({
    required this.name,
    required this.status,
    required this.renewalText,
    required this.outlets,
    required this.tables,
    this.floors = 2,
    this.rooms = 4,
    required this.reportDays,
    this.smsPerMonth = 0,
    this.whatsappPerMonth = 0,
    required this.adsEnabled,
    this.reportsEnabled = false,
    this.employeesEnabled = false,
    this.exportReports = false,
    this.usedOutlets = 0,
    this.usedTables = 0,
    this.usedSms = 0,
    this.usedWhatsapp = 0,
  });

  String limitLabel(int used, int max) {
    if (max < 0) return '$used / Unlimited';
    return '$used / $max';
  }

  @override
  List<Object?> get props => [
        name,
        status,
        renewalText,
        outlets,
        tables,
        floors,
        rooms,
        reportDays,
        smsPerMonth,
        whatsappPerMonth,
        adsEnabled,
        reportsEnabled,
        employeesEnabled,
        exportReports,
        usedOutlets,
        usedTables,
        usedSms,
        usedWhatsapp,
      ];
}

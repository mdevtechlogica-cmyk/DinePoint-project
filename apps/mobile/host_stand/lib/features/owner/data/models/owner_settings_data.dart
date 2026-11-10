import 'package:equatable/equatable.dart';
import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/owner/data/models/faq_item.dart';
import 'package:host_stand/features/owner/data/models/plan_info.dart';
import 'package:host_stand/features/owner/data/models/plan_option.dart';

class OwnerSettingsData extends Equatable {
  final RestaurantProfile profile;
  final PlanInfo plan;
  final List<PlanOption> options;
  final List<FaqItem> faqs;
  final String restaurantShortAddress, terminal, version, build, syncStatus;
  const OwnerSettingsData(
      {required this.profile,
      required this.plan,
      required this.options,
      required this.faqs,
      required this.restaurantShortAddress,
      required this.terminal,
      required this.version,
      required this.build,
      required this.syncStatus});
  @override
  List<Object?> get props => [
        profile,
        plan,
        options,
        faqs,
        restaurantShortAddress,
        terminal,
        version,
        build,
        syncStatus
      ];
}

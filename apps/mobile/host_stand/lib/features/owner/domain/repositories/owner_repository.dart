import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/owner/data/models/owner_settings_data.dart';
import 'package:host_stand/features/owner/data/models/plan_info.dart';
import 'package:host_stand/features/owner/data/models/plan_option.dart';

abstract class OwnerRepository {
  Future<OwnerSettingsData> load();
  Future<RestaurantProfile> saveProfile(RestaurantProfile profile);
  Future<PlanInfo> choosePlan(PlanOption option);
}
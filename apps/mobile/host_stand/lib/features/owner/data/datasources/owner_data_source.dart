import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/owner/data/models/owner_settings_data.dart';
import 'package:host_stand/features/owner/data/models/plan_info.dart';
import 'package:host_stand/features/owner/data/models/plan_option.dart';

abstract class OwnerDataSource {
  Future<OwnerSettingsData> loadOwnerSettings();
  Future<RestaurantProfile> saveProfile(RestaurantProfile profile);
  Future<PlanInfo> selectPlan(PlanOption option);
}

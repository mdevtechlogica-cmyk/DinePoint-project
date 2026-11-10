import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/owner/data/datasources/owner_data_source.dart';
import 'package:host_stand/features/owner/data/models/owner_settings_data.dart';
import 'package:host_stand/features/owner/data/models/plan_info.dart';
import 'package:host_stand/features/owner/data/models/plan_option.dart';
import 'package:host_stand/features/owner/domain/repositories/owner_repository.dart';

class OwnerRepositoryImpl implements OwnerRepository {
  final OwnerDataSource dataSource;
  OwnerRepositoryImpl(this.dataSource);
  @override
  Future<OwnerSettingsData> load() => dataSource.loadOwnerSettings();
  @override
  Future<RestaurantProfile> saveProfile(RestaurantProfile profile) => dataSource.saveProfile(profile);
  @override
  Future<PlanInfo> choosePlan(PlanOption option) => dataSource.selectPlan(option);
}

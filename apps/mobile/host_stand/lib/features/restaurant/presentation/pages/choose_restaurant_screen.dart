import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/restaurant/data/models/restaurant.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/choose_restaurant/restaurant_bloc.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/choose_restaurant/restaurant_event.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/choose_restaurant/restaurant_state.dart';

class ChooseRestaurantScreen extends StatelessWidget {
  const ChooseRestaurantScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    body: SafeArea(child: BlocBuilder<RestaurantBloc, RestaurantState>(
      builder: (context, s) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Your restaurants', style: TextStyle(color: AppColors.ink, fontSize: 28,
                fontWeight: FontWeight.w700, letterSpacing: -.7)),
              SizedBox(height: 12),
              Text('Tap a restaurant to open its host stand.',
                style: TextStyle(color: AppColors.muted, fontSize: 17, height: 1.35)),
            ])),
            const SizedBox(width: 12),
            Column(
              children: [
                Material(
                  color: AppColors.pale,
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () => context.go(AppRoutes.createRestaurant),
                    child: const SizedBox(
                      width: 60,
                      height: 60,
                      child: Icon(Icons.add, size: 29, color: AppColors.ink),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Text('Add', style: TextStyle(color: AppColors.muted, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ]),
          const SizedBox(height: 24),
          Expanded(child: _content(context, s)),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, height: 54,
            child: ElevatedButton(
              onPressed: !s.canContinue
                  ? null
                  : () async {
                      final selected = s.selected!;
                      if (RestaurantBloc.isDemoRestaurantId(selected.id)) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'That restaurant id is invalid. Pick a restaurant from the list.',
                            ),
                          ),
                        );
                        context
                            .read<RestaurantBloc>()
                            .add(const RestaurantsRequested());
                        return;
                      }
                      await sl<SessionCache>().setSelectedRestaurant(
                        restaurantId: selected.id,
                        restaurantName: selected.name,
                      );
                      if (!context.mounted) return;
                      context.go(AppRoutes.dashboard);
                    },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.deepGreen, foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.disabled, elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
              child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text('Continue to Host Stand', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                SizedBox(width: 14), Icon(Icons.arrow_forward, size: 24),
              ]),
            )),
          const SizedBox(height: 12),
          const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.lock_outline, size: 17, color: AppColors.muted), SizedBox(width: 8),
            Flexible(child: Text(AppCopy.bohSync, textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.muted, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: .3))),
          ]),
        ]),
      ),
    )),
  );

  Widget _content(BuildContext context, RestaurantState s) {
    switch (s.status) {
      case RestaurantStatus.initial:
      case RestaurantStatus.loading:
        return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          CircularProgressIndicator(color: AppColors.green), SizedBox(height: 14),
          Text('Loading your restaurants…', style: TextStyle(color: AppColors.muted)),
        ]));
      case RestaurantStatus.failure:
        return Center(child: Padding(padding: const EdgeInsets.all(18), child: Column(
          mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.cloud_off_outlined, size: 42, color: AppColors.muted),
            const SizedBox(height: 12),
            Text(s.error ?? 'We couldn’t load your restaurants.', textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, fontSize: 15)),
            const SizedBox(height: 14),
            OutlinedButton.icon(onPressed: () => context.read<RestaurantBloc>().add(const RestaurantsRequested()),
              icon: const Icon(Icons.refresh), label: const Text('Retry')),
          ],
        )));
      case RestaurantStatus.success:
        if (s.restaurants.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.storefront_outlined, size: 42, color: AppColors.muted),
                  const SizedBox(height: 12),
                  const Text(
                    'No restaurants yet.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.ink, fontSize: 17, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Create your first outlet to open the host stand.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted, fontSize: 15),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () => context.go(AppRoutes.createRestaurant),
                    icon: const Icon(Icons.add),
                    label: const Text('Add restaurant'),
                  ),
                ],
              ),
            ),
          );
        }
        return ListView.separated(itemCount: s.restaurants.length,
          separatorBuilder: (_, __) => const SizedBox(height: 18),
          itemBuilder: (context, i) {
            final r = s.restaurants[i];
            return _RestaurantCard(r: r, selected: r.id == s.selectedId,
              onTap: () => context.read<RestaurantBloc>().add(RestaurantSelected(r.id)));
          });
    }
  }
}

class _RestaurantCard extends StatelessWidget {
  const _RestaurantCard({required this.r, required this.selected, required this.onTap});
  final Restaurant r;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white, borderRadius: BorderRadius.circular(20),
    child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(duration: const Duration(milliseconds: 140),
        padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.deepGreen : Colors.transparent, width: selected ? 2 : 1),
          boxShadow: AppShadows.card),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 36, height: 36, margin: const EdgeInsets.only(top: 2),
            decoration: BoxDecoration(color: selected ? AppColors.deepGreen : AppColors.pale, shape: BoxShape.circle),
            child: selected ? const Icon(Icons.check, color: Colors.white, size: 25) : null),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(child: Padding(padding: const EdgeInsets.only(top: 2),
                child: Text(r.name, style: const TextStyle(color: AppColors.ink, fontSize: 16, fontWeight: FontWeight.w600)))),
              const SizedBox(width: 6),
              Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: r.isActive ? AppColors.active : AppColors.dangerChip,
                  borderRadius: BorderRadius.circular(20)),
                child: Text(r.isActive ? 'Active' : 'Inactive',
                  style: TextStyle(color: r.isActive ? AppColors.deepGreen : AppColors.danger, fontSize: 12, fontWeight: FontWeight.w700))),
            ]),
            const SizedBox(height: 10),
            Row(children: [const Icon(Icons.location_on_outlined, size: 20, color: AppColors.muted),
              const SizedBox(width: 8), Expanded(child: Text('${r.area}, ${r.city}',
                style: const TextStyle(color: AppColors.muted, fontSize: 15)))]),
            const SizedBox(height: 14),
            Row(children: [const Icon(Icons.phone_outlined, size: 19, color: AppColors.muted),
              const SizedBox(width: 8), Expanded(child: Text(r.phone,
                style: const TextStyle(color: AppColors.muted, fontSize: 15)))]),
          ])),
        ]),
      ),
    ),
  );
}

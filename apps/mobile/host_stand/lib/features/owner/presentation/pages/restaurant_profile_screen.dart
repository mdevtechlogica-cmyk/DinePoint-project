import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/dashboard/domain/entities/restaurant_profile.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_bloc.dart';
import 'package:host_stand/features/owner/presentation/blocs/owner_event.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';

class RestaurantProfileScreen extends StatefulWidget {
  final RestaurantProfile profile;
  final bool editing;
  const RestaurantProfileScreen(
      {super.key, required this.profile, required this.editing});
  @override
  State<RestaurantProfileScreen> createState() =>
      _RestaurantProfileScreenState();
}

class _RestaurantProfileScreenState extends State<RestaurantProfileScreen> {
  final formKey = GlobalKey<FormState>();
  late final TextEditingController name, phone, email, address, area, city, pin;
  @override
  void initState() {
    super.initState();
    _setControllers(widget.profile);
  }

  void _setControllers(RestaurantProfile p) {
    name = TextEditingController(text: p.name);
    phone = TextEditingController(text: p.phone);
    email = TextEditingController(text: p.email);
    address = TextEditingController(text: p.address);
    area = TextEditingController(text: p.area);
    city = TextEditingController(text: p.city);
    pin = TextEditingController(text: p.postalCode);
  }

  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    email.dispose();
    address.dispose();
    area.dispose();
    city.dispose();
    pin.dispose();
    super.dispose();
  }

  String? requiredText(String? v) =>
      (v == null || v.trim().isEmpty) ? 'This field is required' : null;
  @override
  Widget build(BuildContext context) => ScreenFrame(
      title: 'Restaurant Profile',
      child: PageBody(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('Restaurant Profile',
              style: Theme.of(context).textTheme.titleLarge),
          const Spacer(),
          TextButton(
              onPressed: () => context
                  .read<OwnerBloc>()
                  .add(EditModeChanged(!widget.editing)),
              child: Text(widget.editing ? 'Cancel' : 'Edit'))
        ]),
        const SizedBox(height: 14),
        Panel(
            child:Form(
                key: formKey,
                child: Column(children: [
                  profileField('Restaurant Name', name, widget.editing,
                      validator: requiredText),
                  profileField('Phone', phone, widget.editing,
                      validator: requiredText),
                  profileField('Email', email, widget.editing,
                      validator: (v) => (v == null || !v.contains('@'))
                          ? 'Enter a valid email'
                          : null),
                  profileField('Address', address, widget.editing,
                      validator: requiredText),
                  profileField('Area / Landmark', area, widget.editing,
                      validator: requiredText),
                  profileField('City', city, widget.editing,
                      validator: requiredText),
                  const Divider(height: 28),
                  Row(children: [
                    const Expanded(
                        child: Text('State (System Locked)',
                            style: TextStyle(color: AppColors.muted))),
                    const Icon(Icons.lock_outline, size: 18)
                  ]),
                  const SizedBox(height: 8),
                  Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                          color: AppColors.pale,
                          borderRadius: BorderRadius.circular(14)),
                      child: Row(children: [
                        Text(
                            widget.profile.state.trim().isEmpty
                                ? 'Kerala'
                                : widget.profile.state,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        const Tag('GST Reg.'),
                      ])),
                  profileField('Postal Code', pin, widget.editing,
                      validator: (v) =>
                          (v == null || !RegExp(r'^\d{6}$').hasMatch(v))
                              ? 'Enter a 6-digit PIN'
                              : null),
                  if (widget.editing) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                            onPressed: () {
                              if (!formKey.currentState!.validate()) return;
                              final ownerName = widget.profile.ownerName
                                      .trim()
                                      .isNotEmpty
                                  ? widget.profile.ownerName
                                  : (sl<SessionCache>().currentUser?.name ??
                                      '');
                              final lockedState =
                                  widget.profile.state.trim().isNotEmpty
                                      ? widget.profile.state
                                      : 'Kerala';
                              context.read<OwnerBloc>().add(
                                  ProfileSaveRequested(RestaurantProfile(
                                      name: name.text,
                                      phone: phone.text,
                                      email: email.text,
                                      address: address.text,
                                      area: area.text,
                                      city: city.text,
                                      state: lockedState,
                                      postalCode: pin.text,
                                      ownerName: ownerName)));
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text('Saving profile…')));
                            },
                            child: const Text('Save changes'))),
                  ],
                ]))),
        const SizedBox(height: 16),
        Builder(builder: (context) {
          final owner = context.watch<OwnerBloc>().state.data;
          final restaurantId = sl<SessionCache>().restaurantId ?? '—';
          return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: AppColors.pale,
                  borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                Icon(Icons.storefront_outlined, color: AppColors.deepGreen),
                const SizedBox(width: 12),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Text(owner?.terminal ?? 'Host Stand',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text('Restaurant ID: $restaurantId'),
                    ])),
                Tag(owner?.syncStatus ?? 'Connected',
                    color: AppColors.paleGreen)
              ]));
        }),
      ])));

  Widget modeChip(BuildContext context, String label, bool edit) => ActionChip(
      label: Text(label),
      backgroundColor:
          (edit == widget.editing) ? AppColors.green : AppColors.pale,
      labelStyle: TextStyle(
          color: (edit == widget.editing) ? Colors.white : AppColors.ink),
      onPressed: () => context.read<OwnerBloc>().add(EditModeChanged(edit)));
  Widget profileField(
          String label, TextEditingController controller, bool enabled,
          {String? Function(String?)? validator}) =>
      Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label,
                style: const TextStyle(
                    color: AppColors.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextFormField(
                controller: controller,
                readOnly: !enabled,
                validator: validator,
                decoration: InputDecoration(
                    filled: !enabled,
                    fillColor: enabled ? Colors.white : Colors.white,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12))),
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.w500)),
          ]));
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/create_restaurant/create_restaurant_bloc.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/create_restaurant/create_restaurant_event.dart';
import 'package:host_stand/features/restaurant/presentation/bloc/create_restaurant/create_restaurant_state.dart';

class CreateRestaurantScreen extends StatefulWidget {
  const CreateRestaurantScreen({super.key});
  @override
  State<CreateRestaurantScreen> createState() => _CreateRestaurantScreenState();
}

class _CreateRestaurantScreenState extends State<CreateRestaurantScreen> {
  final name = TextEditingController(),
      phone = TextEditingController(),
      city = TextEditingController(),
      area = TextEditingController(),
      pin = TextEditingController();
  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    city.dispose();
    area.dispose();
    pin.dispose();
    super.dispose();
  }

  void sync(TextEditingController c, String v) {
    if (c.text == v) return;
    c.value = TextEditingValue(
        text: v, selection: TextSelection.collapsed(offset: v.length));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: BlocConsumer<CreateRestaurantBloc, FormStateData>(
          listenWhen: (a, b) =>
              a.name != b.name ||
              a.phone != b.phone ||
              a.city != b.city ||
              a.area != b.area ||
              a.pin != b.pin ||
              a.status != b.status,
          listener: (context, s) {
            sync(name, s.name);
            sync(phone, s.phone);
            sync(city, s.city);
            sync(area, s.area);
            sync(pin, s.pin);
            if (s.status == FormStatus.saved) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                  content: Text('Restaurant created successfully.'),
                  backgroundColor: AppColors.deepGreen));
              context.go(AppRoutes.restaurants);
            }
          },
          builder: (context, s) => LayoutBuilder(
              builder: (context, box) => SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
                    child: ConstrainedBox(
                      constraints:
                          BoxConstraints(minHeight: box.maxHeight - 18),
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Material(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(AppRadii.back),
                                      child: InkWell(
                                          borderRadius:
                                              BorderRadius.circular(AppRadii.back),
                                          onTap: () =>
                                              context.go(AppRoutes.restaurants),
                                          child: const SizedBox(
                                              width: 64,
                                              height: 64,
                                              child: Icon(Icons.arrow_back,
                                                  size: 30, color: AppColors.ink)))),
                                  const SizedBox(width: 14),
                                  const Expanded(
                                      child: Padding(
                                          padding: EdgeInsets.only(top: 3),
                                          child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Row(children: [
                                                  Icon(Icons.circle,
                                                      size: 10, color: AppColors.green),
                                                  SizedBox(width: 7),
                                                  Expanded(
                                                      child: Text(
                                                          'STEP 2 OF 3 • OUTLET SETUP',
                                                          style: TextStyle(
                                                              color: AppColors.green,
                                                              fontSize: 12,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w700,
                                                              letterSpacing:
                                                                  .55)))
                                                ]),
                                                SizedBox(height: 8),
                                                Text('Create restaurant',
                                                    style: TextStyle(
                                                        color: AppColors.ink,
                                                        fontSize: 25,
                                                        fontWeight:
                                                            FontWeight.w700,
                                                        letterSpacing: -.5)),
                                                SizedBox(height: 7),
                                                Text(
                                                    'Add outlet details. You can configure tables next.',
                                                    style: TextStyle(
                                                        color: AppColors.muted,
                                                        fontSize: 15,
                                                        height: 1.35)),
                                              ]))),
                                ]),
                            const SizedBox(height: 24),
                            Container(
                              padding:
                                  const EdgeInsets.fromLTRB(20, 22, 20, 20),
                              decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(AppRadii.card),
                                  boxShadow: AppShadows.card),
                              child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    _label('Restaurant name', true,
                                        s.errors['name']),
                                    const SizedBox(height: 8),
                                    _field(
                                        name,
                                        'e.g. Saffron House Fort',
                                        s.errors['name'],
                                        !s.busy,
                                        (v) => context
                                            .read<CreateRestaurantBloc>()
                                            .add(NameChanged(v))),
                                    const SizedBox(height: 20),
                                    Row(children: [
                                      Expanded(
                                          child: _label('Phone number', true,
                                              s.errors['phone'])),
                                      const Text('Indian +91',
                                          style: TextStyle(
                                              color: AppColors.muted,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600))
                                    ]),
                                    const SizedBox(height: 8),
                                    _field(
                                        phone,
                                        '+91 98XXX XXXXX',
                                        s.errors['phone'],
                                        !s.busy,
                                        (v) => context
                                            .read<CreateRestaurantBloc>()
                                            .add(PhoneChanged(v)),
                                        type: TextInputType.phone,
                                        formatters: [
                                          FilteringTextInputFormatter.allow(
                                              RegExp(r'[0-9+ ]'))
                                        ]),
                                    const SizedBox(height: 20),
                                    _label('City', true, s.errors['city']),
                                    const SizedBox(height: 8),
                                    _field(
                                        city,
                                        'e.g. Kochi',
                                        s.errors['city'],
                                        !s.busy,
                                        (v) => context
                                            .read<CreateRestaurantBloc>()
                                            .add(CityChanged(v))),
                                    const SizedBox(height: 20),
                                    _label('Area / Locality', false, null),
                                    const SizedBox(height: 8),
                                    _field(
                                        area,
                                        'e.g. Fort Nagar',
                                        null,
                                        !s.busy,
                                        (v) => context
                                            .read<CreateRestaurantBloc>()
                                            .add(AreaChanged(v))),
                                    const SizedBox(height: 20),
                                    _label('Postal code (PIN)', true,
                                        s.errors['pin']),
                                    const SizedBox(height: 8),
                                    _field(
                                        pin,
                                        '6 digits',
                                        s.errors['pin'],
                                        !s.busy,
                                        (v) => context
                                            .read<CreateRestaurantBloc>()
                                            .add(PinChanged(v)),
                                        type: TextInputType.number,
                                        formatters: [
                                          FilteringTextInputFormatter
                                              .digitsOnly,
                                          LengthLimitingTextInputFormatter(6)
                                        ]),
                                    const SizedBox(height: 20),
                                    const Row(children: [
                                      Expanded(
                                          child: Text('State / Union Territory',
                                              style: TextStyle(
                                                  color: AppColors.muted,
                                                  fontSize: 14,
                                                  fontWeight:
                                                      FontWeight.w600))),
                                      Icon(Icons.lock_outline,
                                          size: 15, color: AppColors.muted),
                                      SizedBox(width: 7),
                                      Text('Pre-assigned',
                                          style: TextStyle(
                                              color: AppColors.muted,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600))
                                    ]),
                                    const SizedBox(height: 8),
                                    Container(
                                        height: 64,
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 16),
                                        decoration: BoxDecoration(
                                            color: AppColors.paleSoft,
                                            borderRadius:
                                                BorderRadius.circular(AppRadii.field),
                                            border: Border.all(color: AppColors.lineSoft)),
                                        child: const Row(children: [
                                          Expanded(
                                              child: Text('Kerala',
                                                  style: TextStyle(
                                                      color: AppColors.ink,
                                                      fontSize: 17))),
                                          Icon(Icons.verified_outlined,
                                              color: AppColors.muted, size: 24)
                                        ])),
                                    if (s.message != null) ...[
                                      const SizedBox(height: 14),
                                      _message(s.message!,
                                          s.status == FormStatus.saved)
                                    ],
                                  ]),
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                                height: 54,
                                child: ElevatedButton(
                                    onPressed:
                                        s.busy || s.status == FormStatus.saved
                                            ? null
                                            : () => context
                                                .read<CreateRestaurantBloc>()
                                                .add(const SubmitRestaurant()),
                                    style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.green,
                                        foregroundColor: Colors.white,
                                        disabledBackgroundColor:
                                            AppColors.disabled,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(AppRadii.button))),
                                    child: s.busy
                                        ? const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                                SizedBox(
                                                    width: 18,
                                                    height: 18,
                                                    child:
                                                        CircularProgressIndicator(
                                                            strokeWidth: 2,
                                                            color:
                                                                Colors.white)),
                                                SizedBox(width: 10),
                                                Text('Creating restaurant…',
                                                    style: TextStyle(
                                                        fontSize: 16,
                                                        fontWeight:
                                                            FontWeight.w700))
                                              ])
                                        : Text(
                                            s.status == FormStatus.saved
                                                ? 'Restaurant created'
                                                : 'Create restaurant',
                                            style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700)))),
                            const SizedBox(height: 18),
                            const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.shield_outlined,
                                      size: 17, color: AppColors.muted),
                                  SizedBox(width: 8),
                                  Flexible(
                                      child: Text(
                                          AppCopy.indiaEdition,
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              color: AppColors.muted,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              letterSpacing: .2)))
                                ]),
                          ]),
                    ),
                  )),
        ),
      ));
  Widget _label(String t, bool required, String? error) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        RichText(
            text: TextSpan(
                style: const TextStyle(
                    color: AppColors.ink, fontSize: 14, fontWeight: FontWeight.w600),
                children: [
              TextSpan(text: t),
              if (required)
                const TextSpan(text: ' *', style: TextStyle(color: AppColors.danger))
            ])),
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(error, style: const TextStyle(color: AppColors.danger, fontSize: 12))
        ],
      ]);
  Widget _field(TextEditingController c, String hint, String? error,
          bool enabled, ValueChanged<String> changed,
          {TextInputType? type, List<TextInputFormatter>? formatters}) =>
      TextField(
          controller: c,
          enabled: enabled,
          keyboardType: type,
          inputFormatters: formatters,
          autocorrect: false,
          onChanged: changed,
          decoration: InputDecoration(
              hintText: hint,
              errorText: error,
              filled: true,
              fillColor: Colors.white,
              hintStyle:
                  const TextStyle(color: AppColors.hint, fontSize: 16),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadii.field),
                  borderSide: const BorderSide(color: AppColors.lineSoft)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadii.field),
                  borderSide: const BorderSide(color: AppColors.lineSoft, width: 1.2)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadii.field),
                  borderSide: const BorderSide(color: AppColors.green, width: 1.5)),
              errorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadii.field),
                  borderSide: const BorderSide(color: AppColors.danger))),
          style: const TextStyle(color: AppColors.muted, fontSize: 16));
  Widget _message(String text, bool success) => Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: success ? AppColors.successSoft : AppColors.dangerSoft,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color:
                  success ? AppColors.successBorder : AppColors.dangerBorder)),
      child: Row(children: [
        Icon(success ? Icons.check_circle_outline : Icons.error_outline,
            color: success ? AppColors.green : AppColors.danger, size: 18),
        const SizedBox(width: 8),
        Expanded(
            child: Text(text,
                style: TextStyle(
                    color: success ? AppColors.green : AppColors.danger, fontSize: 13)))
      ]));
}


import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/guest_messaging.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';
import 'package:host_stand/features/spot_booking/presentation/blocs/spot_booking_bloc.dart';
import 'package:host_stand/features/spot_booking/presentation/blocs/spot_booking_event.dart';
import 'package:host_stand/features/spot_booking/presentation/blocs/spot_booking_state.dart';

class SpotBookingScreen extends StatelessWidget {
  const SpotBookingScreen({super.key});
  @override
  Widget build(BuildContext context) => BlocBuilder<SpotBookingBloc, SpotState>(
      builder: (context, s) => Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
              child: s.step == SpotStep.partySize
                  ? _Party(s)
                  : s.step == SpotStep.chooseTable
                      ? _Tables(s)
                      : s.step == SpotStep.guestDetails
                          ? _Guest(s)
                          : _Success(s))));
}


class _Party extends StatelessWidget {
  const _Party(this.s);
  final SpotState s;
  @override
  Widget build(BuildContext context) {
    final b = context.read<SpotBookingBloc>();
    return Column(children: [
      Expanded(
          child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      _icon(Icons.close, () => context.go(AppRoutes.dashboard)),
                      const Expanded(
                          child: Center(
                              child: Text('Step 1 of 3',
                                  style: TextStyle(
                                      fontSize: 15,
                                      color: AppColors.muted,
                                      fontWeight: FontWeight.w600)))),
                      _pill('WALK-IN', AppColors.softGreen, AppColors.muted)
                    ]),
                    const SizedBox(height: 22),
                    const _Progress(1),
                    const SizedBox(height: 24),
                    const Text('New spot booking',
                        style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink)),
                    const SizedBox(height: 8),
                    const Text('How many guests are being seated?',
                        style: TextStyle(fontSize: 17, color: AppColors.muted)),
                    const SizedBox(height: 22),
                    Expanded(
                        child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(22),
                            decoration: BoxDecoration(
                                color: AppColors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [_shadow]),
                            child: Column(children: [
                              const Spacer(),
                              Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    _round(Icons.remove, s.party <= 1,
                                        () => b.add(PartyChanged(s.party - 1))),
                                    Expanded(
                                        child: Column(children: [
                                      Text('${s.party}',
                                          style: const TextStyle(
                                              fontSize: 74,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.ink)),
                                      const Text('guests',
                                          style: TextStyle(
                                              fontSize: 18,
                                              color: AppColors.muted,
                                              fontWeight: FontWeight.w500))
                                    ])),
                                    _round(Icons.add, s.party >= 12,
                                        () => b.add(PartyChanged(s.party + 1)))
                                  ]),
                              const SizedBox(height: 34),
                              GridView.count(
                                  crossAxisCount: 6,
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  crossAxisSpacing: 9,
                                  mainAxisSpacing: 9,
                                  children: List.generate(12, (i) {
                                    final n = i + 1, active = n == s.party;
                                    return InkWell(
                                        onTap: () => b.add(PartyChanged(n)),
                                        borderRadius: BorderRadius.circular(10),
                                        child: Container(
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(
                                                color: active
                                                    ? AppColors.green
                                                    : AppColors.zoneSoft,
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                                border: active
                                                    ? Border.all(
                                                        color:
                                                            AppColors.deepGreen)
                                                    : null),
                                            child: Text('$n',
                                                style: TextStyle(
                                                    fontSize: 16,
                                                    color: active
                                                        ? AppColors.white
                                                        : AppColors.ink,
                                                    fontWeight: active
                                                        ? FontWeight.w700
                                                        : FontWeight.w500))));
                                  })),
                              const Spacer()
                            ]))),
                    const SizedBox(height: 18),
                    SizedBox(
                        width: double.infinity,
                        height: 62,
                        child: FilledButton(
                            onPressed: s.canGoTable
                                ? () => b.add(const GoTable())
                                : null,
                            style: FilledButton.styleFrom(
                                backgroundColor: AppColors.green,
                                disabledBackgroundColor: AppColors.previewTrack,
                                foregroundColor: AppColors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(17))),
                            child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Next',
                                      style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600)),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward)
                                ]))),
                    const SizedBox(height: 18),
                    const Center(
                        child: Text('DinePoint Host Stand • Shift Seating',
                            style: TextStyle(
                                fontSize: 14, color: AppColors.muted))),
                    const SizedBox(height: 12)
                  ])))
    ]);
  }
}

class _Tables extends StatelessWidget {
  const _Tables(this.s);
  final SpotState s;
  @override
  Widget build(BuildContext context) {
    final b = context.read<SpotBookingBloc>();
    final rooms = <String, List<DiningTable>>{};
    for (final t in s.currentTables) {
      rooms.putIfAbsent(t.room, () => []).add(t);
    }
    return Column(children: [
      Expanded(
          child: Column(children: [
        Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(children: [
              Row(children: [
                _icon(Icons.arrow_back, () => b.add(const GoParty())),
                const Expanded(
                    child: Center(
                        child: Text('Step 2 of 3',
                            style: TextStyle(
                                fontSize: 15,
                                color: AppColors.muted,
                                fontWeight: FontWeight.w600)))),
                _pill('WALK-IN', AppColors.softGreen, AppColors.muted)
              ]),
              const SizedBox(height: 18),
              const _Progress(2),
              const SizedBox(height: 20),
              const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Choose a table',
                      style: TextStyle(
                          fontSize: 27,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink))),
              const SizedBox(height: 7),
              Row(children: [
                const Icon(Icons.people_alt_outlined,
                    color: AppColors.muted, size: 20),
                const SizedBox(width: 7),
                Text('Party of ${s.party} guests',
                    style:
                        const TextStyle(fontSize: 15, color: AppColors.muted)),
                const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 7),
                    child: Text('•', style: TextStyle(color: AppColors.line))),
                const Expanded(
                    child: Text('Immediate seating',
                        style: TextStyle(fontSize: 13, color: AppColors.muted)))
              ]),
              const SizedBox(height: 20),
              SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                      children: FloorName.values.map((f) {
                    final active = f == s.floor;
                    return Padding(
                        padding: const EdgeInsets.only(right: 9),
                        child: ChoiceChip(
                            selected: active,
                            label: Text(f.label),
                            avatar: active
                                ? const Icon(Icons.layers_outlined,
                                    size: 17, color: AppColors.white)
                                : null,
                            onSelected: (_) => b.add(FloorChanged(f)),
                            backgroundColor: AppColors.white,
                            selectedColor: AppColors.green,
                            showCheckmark: false,
                            labelStyle: TextStyle(
                                color: active ? AppColors.white : AppColors.ink,
                                fontWeight: FontWeight.w600),
                            side: BorderSide.none,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10)));
                  }).toList()))
            ])),
        Expanded(
            child: s.status == LoadStatus.loading
                ? const _Loading()
                : s.status == LoadStatus.failure
                    ? _Err(s.error ?? 'We couldn’t load tables.',
                        () => b.add(const Started()))
                    : s.currentTables.isEmpty
                        ? const _Empty()
                        : ListView(
                            padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
                            children: [
                                ...rooms.entries.map((entry) {
                                  final free = entry.value
                                      .where((t) =>
                                          t.availability ==
                                              TableAvailability.free &&
                                          t.seats >= s.party)
                                      .length;
                                  return Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(children: [
                                          Expanded(
                                              child: Text(
                                                  entry.key.toUpperCase(),
                                                  style: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                      color: AppColors.muted,
                                                      letterSpacing: 1))),
                                          Text(
                                              '$free of ${entry.value.length} Free',
                                              style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.muted,
                                                  fontWeight: FontWeight.w600))
                                        ]),
                                        const SizedBox(height: 10),
                                        GridView.builder(
                                            shrinkWrap: true,
                                            physics:
                                                const NeverScrollableScrollPhysics(),
                                            itemCount: entry.value.length,
                                            gridDelegate:
                                                const SliverGridDelegateWithFixedCrossAxisCount(
                                                    crossAxisCount: 2,
                                                    crossAxisSpacing: 12,
                                                    mainAxisSpacing: 12,
                                                    childAspectRatio: 1.24),
                                            itemBuilder: (context, i) =>
                                                _TableCard(
                                                    t: entry.value[i],
                                                    selected:
                                                        s
                                                                .selected?.id ==
                                                            entry.value[i].id,
                                                    party: s.party,
                                                    onTap: () => b.add(
                                                        TablePicked(
                                                            entry.value[i])))),
                                        const SizedBox(height: 22)
                                      ]);
                                }),
                                if (s.selected != null)
                                  Container(
                                      padding: const EdgeInsets.all(15),
                                      decoration: BoxDecoration(
                                          color: AppColors.zoneSoft,
                                          borderRadius:
                                              BorderRadius.circular(16)),
                                      child: Row(children: [
                                        const Icon(Icons.info_outline,
                                            color: AppColors.deepGreen,
                                            size: 23),
                                        const SizedBox(width: 12),
                                        Expanded(
                                            child: Text(
                                                'Table ${s.selected!.number} is recommended for quick turnaround near service aisle 1.',
                                                style: const TextStyle(
                                                    fontSize: 13,
                                                    color: AppColors.muted)))
                                      ]))
                              ])),
        Container(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
            child: Row(children: [
              Expanded(
                  child: SizedBox(
                      height: 58,
                      child: OutlinedButton.icon(
                          onPressed: () => b.add(const GoParty()),
                          icon: const Icon(Icons.arrow_back),
                          label: const Text('Back'),
                          style: OutlinedButton.styleFrom(
                              backgroundColor: AppColors.white,
                              foregroundColor: AppColors.ink,
                              side: BorderSide.none,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16)))))),
              const SizedBox(width: 12),
              Expanded(
                  flex: 2,
                  child: SizedBox(
                      height: 58,
                      child: FilledButton(
                          onPressed: s.canGoGuest
                              ? () => b.add(const GoGuest())
                              : null,
                          style: FilledButton.styleFrom(
                              backgroundColor: AppColors.green,
                              disabledBackgroundColor: AppColors.previewTrack,
                              foregroundColor: AppColors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16))),
                          child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('Select a Table',
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600)),
                                SizedBox(width: 7),
                                Icon(Icons.arrow_forward)
                              ]))))
            ]))
      ]))
    ]);
  }
}

class _TableCard extends StatelessWidget {
  const _TableCard(
      {required this.t,
      required this.selected,
      required this.party,
      required this.onTap});
  final DiningTable t;
  final bool selected;
  final int party;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final busy = t.availability == TableAvailability.busy,
        small = t.seats < party,
        disabled = busy || small;
    final muted = disabled ? AppColors.caption : AppColors.ink;
    return Opacity(
        opacity: busy ? 0.68 : 1,
        child: Material(
            color: busy ? AppColors.paleGreen : AppColors.white,
            borderRadius: BorderRadius.circular(17),
            child: InkWell(
                onTap: disabled ? null : onTap,
                borderRadius: BorderRadius.circular(17),
                child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(17),
                        border: Border.all(
                            color:
                                selected ? AppColors.deepGreen : AppColors.line,
                            width: selected ? 2 : .6),
                        boxShadow: [if (!busy) _shadow]),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Expanded(
                                child: Text(
                                    'Table ${t.number}${selected ? ' •' : ''}',
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: muted))),
                            _pill(
                                busy
                                    ? 'Busy'
                                    : small
                                        ? 'Too small'
                                        : 'Free',
                                busy ? AppColors.previewTrack : AppColors.mint,
                                busy ? muted : AppColors.deepGreen)
                          ]),
                          const SizedBox(height: 8),
                          Text(
                              '${t.seats} seats${t.seats == party ? ' (Exact)' : ''}',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: disabled
                                      ? muted
                                      : (selected
                                          ? AppColors.deepGreen
                                          : AppColors.muted),
                                  fontWeight: selected
                                      ? FontWeight.w600
                                      : FontWeight.w400)),
                          const Spacer(),
                          Wrap(spacing: 5, runSpacing: 4, children: [
                            if (t.hasAc) _tag('AC'),
                            if (t.family) _tag('FAMILY'),
                            if (t.tag.isNotEmpty) _tag(t.tag)
                          ]),
                          if (busy && t.busyNote.isNotEmpty)
                            Align(
                                alignment: Alignment.centerRight,
                                child: Text(t.busyNote,
                                    style:
                                        TextStyle(fontSize: 11, color: muted)))
                        ])))));
  }
}

class _Guest extends StatefulWidget {
  const _Guest(this.initial);
  final SpotState initial;
  @override
  State<_Guest> createState() => _GuestState();
}

class _GuestState extends State<_Guest> {
  late final TextEditingController name, phone, note;
  @override
  void initState() {
    super.initState();
    name = TextEditingController(text: widget.initial.name);
    phone = TextEditingController(text: widget.initial.phone);
    note = TextEditingController(text: widget.initial.note);
  }

  @override
  void didUpdateWidget(covariant _Guest old) {
    super.didUpdateWidget(old);
    if (name.text != widget.initial.name) name.text = widget.initial.name;
    if (phone.text != widget.initial.phone) phone.text = widget.initial.phone;
    if (note.text != widget.initial.note) note.text = widget.initial.note;
  }

  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    note.dispose();
    super.dispose();
  }
  void update() => context
      .read<SpotBookingBloc>()
      .add(GuestChanged(name.text, phone.text, note.text));
  @override
  Widget build(BuildContext context) =>
      BlocBuilder<SpotBookingBloc, SpotState>(builder: (context, s) {
        final b = context.read<SpotBookingBloc>();
        return Column(children: [
          Container(
              height: 54,
              padding: const EdgeInsets.symmetric(horizontal: 18),
              child: Row(children: [
                _icon(Icons.arrow_back, () => b.add(const GoBackTable())),
                const SizedBox(width: 12),
                const Expanded(
                    child: Text('Guest Details',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink))),
                const CircleAvatar(
                    radius: 19,
                    backgroundColor: AppColors.deepGreen,
                    child: Icon(Icons.person_outline, color: AppColors.white))
              ])),
          Expanded(
              child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  children: [
                Row(children: [
                  const Expanded(
                      child: Text('STEP 3 OF 3',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.muted,
                              letterSpacing: .7))),
                  _pill('WALK-IN', AppColors.softGreen, AppColors.ink)
                ]),
                const SizedBox(height: 15),
                const _Progress(3),
                const SizedBox(height: 24),
                const Text('Guest details',
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink)),
                const SizedBox(height: 7),
                const Text(
                    'Enter guest contact for immediate seating notification.',
                    style: TextStyle(fontSize: 14, color: AppColors.muted)),
                const SizedBox(height: 18),
                Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(17),
                        boxShadow: [_shadow]),
                    child: Row(children: [
                      Container(
                          width: 62,
                          height: 62,
                          decoration: BoxDecoration(
                              color: AppColors.successSoft,
                              borderRadius: BorderRadius.circular(15)),
                          child: const Icon(Icons.table_restaurant_outlined,
                              color: AppColors.deepGreen, size: 30)),
                      const SizedBox(width: 14),
                      Expanded(
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                            Text(
                                s.selected == null
                                    ? 'Choose a table first'
                                    : 'Table ${s.selected!.number}',
                                style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.ink)),
                            const SizedBox(height: 3),
                            Text(
                                s.selected == null
                                    ? 'No table selected'
                                    : '${s.selected!.floor.label} · ${s.selected!.room} · ${s.selected!.seats} seats${s.selected!.family ? ' · Family' : ''}',
                                style: const TextStyle(
                                    fontSize: 12, color: AppColors.muted)),
                            const SizedBox(height: 4),
                            Text('♙  Party of ${s.party} guests',
                                style: const TextStyle(
                                    fontSize: 12, color: AppColors.muted))
                          ])),
                      _pill('● Assigned', AppColors.successSoft,
                          AppColors.deepGreen)
                    ])),
                const SizedBox(height: 18),
                Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [_shadow]),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Guest name *'),
                          TextField(
                              controller: name,
                              textCapitalization: TextCapitalization.words,
                              onChanged: (_) => update(),
                              decoration: _input("Guest's full name")),
                          const SizedBox(height: 17),
                          Row(children: [
                            const Expanded(
                                child: Text('Phone number *',
                                    style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.ink))),
                            const Text('Indian (+91)',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.muted))
                          ]),
                          const SizedBox(height: 7),
                          TextField(
                              controller: phone,
                              keyboardType: TextInputType.phone,
                              onChanged: (_) => update(),
                              decoration: _input('98XXX XXXXX').copyWith(
                                  prefixText: '+91  ',
                                  prefixStyle: const TextStyle(
                                      fontSize: 15, color: AppColors.ink))),
                          const SizedBox(height: 17),
                          Row(children: [
                            const Expanded(
                                child: Text('Note (optional)',
                                    style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.ink))),
                            const Text('Back of house visible',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.muted))
                          ]),
                          const SizedBox(height: 7),
                          TextField(
                              controller: note,
                              maxLines: 3,
                              onChanged: (_) => update(),
                              decoration: _input(
                                  'e.g. Birthday, high chair needed, anniversary')),
                          const SizedBox(height: 14),
                          Wrap(spacing: 7, children: [
                            _suggest(
                                '♧ High chair', () => _append('High chair')),
                            _suggest('♙ Birthday', () => _append('Birthday')),
                            _suggest('⊞ Window', () => _append('Window'))
                          ]),
                          if (s.validation != null)
                            Padding(
                                padding: const EdgeInsets.only(top: 12),
                                child: Text(s.validation!,
                                    style: const TextStyle(
                                        color: AppColors.danger,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600))),
                          if (s.error != null)
                            Padding(
                                padding: const EdgeInsets.only(top: 12),
                                child: Text(s.error!,
                                    style: const TextStyle(
                                        color: AppColors.danger,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600)))
                        ])),
                const SizedBox(height: 16),
                Container(
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                        color: AppColors.zoneSoft,
                        borderRadius: BorderRadius.circular(16)),
                    child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.chat_bubble_outline,
                              color: AppColors.deepGreen, size: 22),
                          SizedBox(width: 12),
                          Expanded(
                              child: Text(
                                  'An instant WhatsApp/SMS notification with Table details and digital menu link will dispatch upon confirmation.',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.muted,
                                      height: 1.4)))
                        ])),
                const SizedBox(height: 17),
                Row(children: [
                  Expanded(
                      child: SizedBox(
                          height: 58,
                          child: OutlinedButton(
                              onPressed: () => b.add(const GoBackTable()),
                              style: OutlinedButton.styleFrom(
                                  backgroundColor: AppColors.previewTrack,
                                  foregroundColor: AppColors.ink,
                                  side: BorderSide.none,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16))),
                              child: const Text('Back',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w700))))),
                  const SizedBox(width: 12),
                  Expanded(
                      flex: 2,
                      child: SizedBox(
                          height: 58,
                          child: FilledButton(
                              onPressed: s.status == LoadStatus.seating
                                  ? null
                                  : () => b.add(const SeatPressed()),
                              style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.green,
                                  foregroundColor: AppColors.white,
                                  disabledBackgroundColor: AppColors.green,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16))),
                              child: s.status == LoadStatus.seating
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: AppColors.white))
                                  : const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                          Icon(Icons.check_circle_outline),
                                          SizedBox(width: 8),
                                          Text('Seat guest',
                                              style: TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w700))
                                        ]))))
                ])
              ]))
        ]);
      });
  void _append(String v) {
    note.text = note.text.trim().isEmpty ? v : '${note.text.trim()}, $v';
    update();
  }
}

class _Success extends StatelessWidget {
  const _Success(this.s);
  final SpotState s;
  @override
  Widget build(BuildContext context) {
    final b = context.read<SpotBookingBloc>();
    final booking = s.booking;
    return Column(children: [
      Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(children: [
            const Icon(Icons.storefront_outlined,
                color: AppColors.deepGreen, size: 20),
            const SizedBox(width: 9),
            const Expanded(
                child: Text('DinePoint Host Stand',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink))),
            SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(value: true, label: Text('Free Plan')),
                  ButtonSegment(value: false, label: Text('Paid Plan'))
                ],
                selected: {
                  s.freePlan
                },
                showSelectedIcon: false,
                style: ButtonStyle(
                    visualDensity: VisualDensity.compact,
                    textStyle: WidgetStateProperty.all(const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w600))),
                onSelectionChanged: (v) => b.add(PlanChanged(v.first)))
          ])),
      Expanded(
          child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 18),
              children: [
            Center(
                child: Container(
                    width: 118,
                    height: 118,
                    decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.successSoft,
                        border: Border.all(
                            color: AppColors.successBorder, width: 8)),
                    child: const CircleAvatar(
                        backgroundColor: Color(0xFF367D5D),
                        child: Icon(Icons.check,
                            size: 56, color: AppColors.white)))),
            const SizedBox(height: 18),
            const Center(
                child: Text('Guest seated',
                    style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink))),
            const SizedBox(height: 6),
            Center(
                child: Text('Table ${booking?.table.number ?? 4} is now busy.',
                    style:
                        const TextStyle(fontSize: 18, color: AppColors.muted))),
            const SizedBox(height: 17),
            Center(
                child: _pill('● WALK-IN COMPLETED • IMMEDIATE SEATING',
                    AppColors.zoneSoft, AppColors.muted)),
            const SizedBox(height: 24),
            Container(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [_shadow]),
                child: Column(children: [
                  _summary('Guest', booking?.guest.name ?? 'Deepa Krishnan'),
                  _summary('Party', '♙  ${booking?.partySize ?? 4} guests'),
                  _summary('Table',
                      '♜  Table ${booking?.table.number ?? 4} · ${booking?.table.room ?? 'AC Hall'} · ${booking?.table.floor.label ?? 'Ground'}'),
                  _summary('Time', '◷  Today, ${_time(booking?.seatedAt)}',
                      last: true)
                ])),
            if (s.freePlan && s.showUpgrade)
              Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(17),
                          boxShadow: [_shadow]),
                      child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                                width: 43,
                                height: 43,
                                decoration: BoxDecoration(
                                    color: AppColors.zoneSoft,
                                    borderRadius: BorderRadius.circular(12)),
                                child: const Icon(Icons.auto_awesome,
                                    color: AppColors.deepGreen)),
                            const SizedBox(width: 12),
                            const Expanded(
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                  Text('Upgrade to remove ads',
                                      style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.ink)),
                                  SizedBox(height: 5),
                                  Text(
                                      'Get a clean host stand with no banners.',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.muted)),
                                  SizedBox(height: 9),
                                  Text('See plans  →',
                                      style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.deepGreen))
                                ])),
                            IconButton(
                                onPressed: () =>
                                    b.add(const UpgradeDismissed()),
                                icon: const Icon(Icons.close,
                                    color: AppColors.muted))
                          ]))),
            const SizedBox(height: 20),
            SizedBox(
                height: 58,
                child: FilledButton.icon(
                    onPressed: () {
                      final id = booking?.id ?? 'r2';
                      context.push(AppRoutes.bookingDetailPath(id));
                    },
                    style: FilledButton.styleFrom(
                        backgroundColor: AppColors.green,
                        foregroundColor: AppColors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16))),
                    icon: const Icon(Icons.assignment_outlined),
                    label: const Text('View booking',
                        style: TextStyle(
                            fontSize: 17, fontWeight: FontWeight.w700)))),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                  child: OutlinedButton.icon(
                      onPressed: () {
                        final phone = booking?.guest.phone ?? '';
                        final table = booking?.table.number ?? 0;
                        final venue =
                            sl<SessionCache>().restaurantName ?? 'the restaurant';
                        sendGuestMessage(
                          context,
                          channel: GuestMessageChannel.sms,
                          phone: phone,
                          reservationId: booking?.id,
                          body:
                              'You are seated at Table $table at $venue. Welcome!',
                        );
                      },
                      icon: const Icon(Icons.sms_outlined,
                          color: AppColors.muted),
                      label: const Text('Share SMS',
                          style: TextStyle(color: AppColors.ink)),
                      style: OutlinedButton.styleFrom(
                          backgroundColor: AppColors.white,
                          side: BorderSide.none,
                          padding: const EdgeInsets.symmetric(vertical: 17)))),
              const SizedBox(width: 10),
              Expanded(
                  child: OutlinedButton.icon(
                      onPressed: () {
                        final phone = booking?.guest.phone ?? '';
                        final table = booking?.table.number ?? 0;
                        final venue =
                            sl<SessionCache>().restaurantName ?? 'the restaurant';
                        sendGuestMessage(
                          context,
                          channel: GuestMessageChannel.whatsapp,
                          phone: phone,
                          reservationId: booking?.id,
                          body:
                              'You are seated at Table $table at $venue. Welcome!',
                        );
                      },
                      icon: const Icon(Icons.chat_outlined,
                          color: AppColors.deepGreen),
                      label: const Text('Share WhatsApp',
                          style: TextStyle(color: AppColors.ink)),
                      style: OutlinedButton.styleFrom(
                          backgroundColor: AppColors.white,
                          side: BorderSide.none,
                          padding: const EdgeInsets.symmetric(vertical: 17))))
            ]),
            const SizedBox(height: 15),
            Center(
                child: TextButton.icon(
                    onPressed: () => context.go(AppRoutes.dashboard),
                    icon: const Icon(Icons.arrow_back,
                        color: AppColors.deepGreen),
                    label: const Text('Back to today',
                        style: TextStyle(
                            color: AppColors.deepGreen,
                            fontSize: 16,
                            fontWeight: FontWeight.w700))))
          ]))
    ]);
  }
}

class _Progress extends StatelessWidget {
  const _Progress(this.current);
  final int current;
  @override
  Widget build(BuildContext context) => Row(
      children: List.generate(
          3,
          (i) => Expanded(
              child: Container(
                  height: 7,
                  margin: EdgeInsets.only(right: i == 2 ? 0 : 8),
                  decoration: BoxDecoration(
                      color: i < current ? AppColors.green : AppColors.line,
                      borderRadius: BorderRadius.circular(8))))));
}

class _Loading extends StatelessWidget {
  const _Loading();
  @override
  Widget build(BuildContext context) => const Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        CircularProgressIndicator(color: AppColors.green),
        SizedBox(height: 12),
        Text('Loading available tables…',
            style: TextStyle(color: AppColors.muted))
      ]));
}

class _Empty extends StatelessWidget {
  const _Empty();
  @override
  Widget build(BuildContext context) => const Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.table_restaurant_outlined, size: 42, color: AppColors.muted),
        SizedBox(height: 12),
        Text('No tables yet',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.ink)),
        SizedBox(height: 5),
        Text('Add tables to this floor before seating a walk-in.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.muted))
      ]));
}

class _Err extends StatelessWidget {
  const _Err(this.message, this.retry);
  final String message;
  final VoidCallback retry;
  @override
  Widget build(BuildContext context) => Center(
      child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.cloud_off_outlined,
                size: 40, color: AppColors.muted),
            const SizedBox(height: 10),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 12),
            FilledButton.icon(
                onPressed: retry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'))
          ])));
}

Widget _icon(IconData icon, VoidCallback tap) => Material(
    color: AppColors.white,
    borderRadius: BorderRadius.circular(13),
    child: InkWell(
        onTap: tap,
        borderRadius: BorderRadius.circular(13),
        child: SizedBox(
            width: 45,
            height: 45,
            child: Icon(icon, size: 25, color: AppColors.ink))));
Widget _pill(String text, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration:
        BoxDecoration(color: bg, borderRadius: BorderRadius.circular(22)),
    child: Text(text,
        style:
            TextStyle(fontSize: 11, color: fg, fontWeight: FontWeight.w700)));
Widget _tag(String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
    decoration: BoxDecoration(
        color: AppColors.zoneSoft, borderRadius: BorderRadius.circular(6)),
    child: Text(text,
        style: const TextStyle(
            fontSize: 10,
            color: AppColors.muted,
            fontWeight: FontWeight.w700)));
Widget _round(IconData icon, bool disabled, VoidCallback tap) => Material(
    color: AppColors.zoneSoft,
    shape: const CircleBorder(),
    child: InkWell(
        onTap: disabled ? null : tap,
        customBorder: const CircleBorder(),
        child: SizedBox(
            width: 68,
            height: 68,
            child: Icon(icon,
                size: 34,
                color: disabled ? AppColors.disabled : AppColors.green))));
Widget _label(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 7),
    child: Text(t,
        style: const TextStyle(
            fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink)));
InputDecoration _input(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: AppColors.hint, fontSize: 15),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
    border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: AppColors.line)),
    enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: AppColors.line)),
    focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: AppColors.green, width: 1.5)));
Widget _suggest(String t, VoidCallback tap) => ActionChip(
    label: Text(t,
        style: const TextStyle(
            fontSize: 11, color: AppColors.muted, fontWeight: FontWeight.w600)),
    onPressed: tap,
    backgroundColor: AppColors.zoneSoft,
    side: BorderSide.none);
Widget _summary(String label, String value, {bool last = false}) => Container(
    padding: const EdgeInsets.symmetric(vertical: 17),
    decoration: BoxDecoration(
        border: Border(
            bottom:
                BorderSide(color: last ? Colors.transparent : AppColors.line))),
    child: Row(children: [
      Expanded(
          child: Text(label,
              style: const TextStyle(fontSize: 14, color: AppColors.muted))),
      Flexible(
          child: Text(value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink)))
    ]));
String _time(DateTime? d) => d == null
    ? '7:30 PM'
    : (d.hour > 12
        ? '${d.hour - 12}:${d.minute.toString().padLeft(2, '0')} PM'
        : '${d.hour}:${d.minute.toString().padLeft(2, '0')} PM');
final _shadow = BoxShadow(
    color: Colors.black.withValues(alpha: .035),
    blurRadius: 5,
    offset: const Offset(0, 2));

typedef SpotBookingFlow = SpotBookingScreen;

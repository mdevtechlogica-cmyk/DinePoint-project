import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/contact_actions.dart';
import 'package:host_stand/core/guest_messaging.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/booking/data/models/booking_detail.dart';
import 'package:host_stand/features/booking/presentation/blocs/booking_detail_bloc.dart';
import 'package:host_stand/features/booking/presentation/blocs/booking_detail_event.dart';
import 'package:host_stand/features/booking/presentation/blocs/booking_detail_state.dart';

class BookingDetailScreen extends StatelessWidget {
  const BookingDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingDetailBloc, BookingDetailState>(
      listenWhen: (a, b) => a.successMessage != b.successMessage || a.errorMessage != b.errorMessage,
      listener: (context, state) {
        final message = state.errorMessage ?? state.successMessage;
        if (message != null) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(SnackBar(content: Text(message)));
        }
      },
      builder: (context, state) {
        if (state.phase == BookingDetailPhase.loading || state.phase == BookingDetailPhase.initial) {
          return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.green)));
        }
        if (state.phase == BookingDetailPhase.failure && state.booking == null) {
          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(child: Center(child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.cloud_off_outlined, size: 44, color: AppColors.muted),
                const SizedBox(height: 12),
                Text(state.errorMessage ?? 'Unable to load booking.', textAlign: TextAlign.center),
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: () => context.read<BookingDetailBloc>().add(const BookingDetailRetryRequested()),
                  icon: const Icon(Icons.refresh), label: const Text('Retry'),
                ),
              ]),
            ))),
          );
        }
        final booking = state.booking!;
        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: Column(children: [
              _TopBar(),
              Expanded(child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
                children: [
                  Row(children: [
                    const Icon(Icons.circle, size: 14, color: AppColors.green),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        [
                          if (booking.floor.trim().isNotEmpty) booking.floor,
                          if (booking.room.trim().isNotEmpty) booking.room,
                          'Table ${booking.tableNumber}',
                        ].join(' · ').toUpperCase(),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: .5,
                          color: AppColors.muted,
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 12),
                  _GuestCard(booking: booking),
                  const SizedBox(height: 18),
                  _BreakdownCard(booking: booking),
                  if (state.errorMessage != null) ...[
                    const SizedBox(height: 12),
                    _MessageBanner(message: state.errorMessage!, isError: true),
                  ],
                  const SizedBox(height: 22),
                  SizedBox(
                    height: 62,
                    child: FilledButton(
                      onPressed: state.phase == BookingDetailPhase.updating || booking.status != BookingStatus.seated
                        ? null
                        : () => _confirmStatus(context, BookingStatus.completed),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.green,
                        disabledBackgroundColor: AppColors.disabled,
                        foregroundColor: AppColors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17)),
                      ),
                      child: state.phase == BookingDetailPhase.updating
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white))
                        : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(Icons.check_circle_outline, size: 24),
                            SizedBox(width: 10),
                            Text('Complete Booking', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                          ]),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(child: _DangerAction(
                      icon: Icons.cancel_outlined,
                      label: 'Cancel',
                      enabled: state.phase != BookingDetailPhase.updating && booking.status == BookingStatus.seated,
                      onTap: () => _confirmStatus(context, BookingStatus.cancelled),
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: _DangerAction(
                      icon: Icons.person_off_outlined,
                      label: 'No-show',
                      enabled: state.phase != BookingDetailPhase.updating && booking.status == BookingStatus.seated,
                      onTap: () => _confirmStatus(context, BookingStatus.noShow),
                    )),
                  ]),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                    decoration: BoxDecoration(color: AppColors.zoneSoft, borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      const Icon(Icons.history, color: AppColors.muted, size: 20),
                      const SizedBox(width: 9),
                      Expanded(child: Text('Assigned by ${booking.assignedBy} at ${_clock(booking.assignedAt)}',
                        style: const TextStyle(fontSize: 12, color: AppColors.muted))),
                      Text(booking.terminalId, style: const TextStyle(fontSize: 11, color: AppColors.muted, fontWeight: FontWeight.w800)),
                    ]),
                  ),
                  if (state.phase == BookingDetailPhase.updating) ...[
                    const SizedBox(height: 12),
                    const LinearProgressIndicator(color: AppColors.green),
                  ],
                ],
              )),
            ]),
          ),
        );
      },
    );
  }

  static Future<void> _confirmStatus(BuildContext context, BookingStatus status) async {
    final verb = switch (status) {
      BookingStatus.completed => 'complete this booking',
      BookingStatus.cancelled => 'cancel this booking',
      BookingStatus.noShow => 'mark this guest as a no-show',
      BookingStatus.seated => 'mark this guest as seated',
    };
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('${status.label}?'),
        content: Text('Are you sure you want to $verb?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Keep booking')),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(status == BookingStatus.cancelled ? 'Cancel booking' : status.label),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      context.read<BookingDetailBloc>().add(BookingStatusActionRequested(status));
    }
  }
}

class _TopBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    height: 78,
    padding: const EdgeInsets.symmetric(horizontal: 22),
    child: Row(children: [
      IconButton(
        onPressed: () => Navigator.maybePop(context),
        icon: const Icon(Icons.arrow_back, size: 28, color: AppColors.ink),
      ),
      const SizedBox(width: 10),
      const Expanded(child: Text('Booking Details',
        style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.ink))),
      const CircleAvatar(
        radius: 23, backgroundColor: AppColors.deepGreen,
        child: Icon(Icons.person_outline, color: AppColors.white, size: 25),
      ),
    ]),
  );
}

class _GuestCard extends StatelessWidget {
  const _GuestCard({required this.booking});
  final BookingDetail booking;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: _cardDecoration(),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(booking.guestName, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 6),
          Text(booking.phone, style: const TextStyle(fontSize: 16, color: AppColors.muted)),
        ])),
        _StatusPill(status: booking.status),
      ]),
      const SizedBox(height: 26),
      Row(children: [
        Expanded(child: _ContactButton(
          icon: Icons.call, label: 'Call Guest',
          onTap: () => launchPhoneCall(context, booking.phone),
        )),
        const SizedBox(width: 12),
        Expanded(child: _ContactButton(
          icon: Icons.chat, label: 'WhatsApp',
          onTap: () => sendGuestMessage(
            context,
            channel: GuestMessageChannel.whatsapp,
            phone: booking.phone,
            reservationId: booking.id,
            body:
                'Hi ${booking.guestName}, your table at DinePoint Host Stand is ready. Ref ${booking.reference}',
          ),
        )),
      ]),
    ]),
  );
}

class _BreakdownCard extends StatelessWidget {
  const _BreakdownCard({required this.booking});
  final BookingDetail booking;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
    decoration: _cardDecoration(),
    child: Column(children: [
      Row(children: [
        const Expanded(child: Text('BOOKING BREAKDOWN',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: .4, color: AppColors.muted))),
        Text('Ref: ${booking.reference}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.muted)),
      ]),
      const SizedBox(height: 16),
      _DetailRow(icon: Icons.people_outline, label: 'Party', value: '${booking.partySize} guests'),
      _DetailRow(icon: Icons.layers_outlined, label: 'Floor', value: booking.floor),
      _DetailRow(icon: Icons.meeting_room_outlined, label: 'Room', value: booking.room),
      _DetailRow(icon: Icons.table_restaurant_outlined, label: 'Table',
        value: 'Table ${booking.tableNumber}', highlight: true),
      _DetailRow(icon: Icons.access_time, label: 'Reserved Time', value: 'Today, ${_clock(booking.reservedTime)}'),
      _DetailRow(icon: Icons.info_outline, label: 'Status', value: booking.status.label, status: booking.status),
      const SizedBox(height: 6),
      Row(children: [
        const Icon(Icons.cake_outlined, size: 21, color: AppColors.muted),
        const SizedBox(width: 12),
        const Text('Guest Note', style: TextStyle(fontSize: 15, color: AppColors.muted)),
      ]),
      const SizedBox(height: 10),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(color: AppColors.pale, borderRadius: BorderRadius.circular(13)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.celebration_outlined, size: 22, color: AppColors.deepGreen),
          const SizedBox(width: 12),
          Expanded(child: Text(booking.guestNote, style: const TextStyle(fontSize: 15, height: 1.35, color: AppColors.ink))),
        ]),
      ),
    ]),
  );
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.label, required this.value, this.highlight = false, this.status});
  final IconData icon;
  final String label;
  final String value;
  final bool highlight;
  final BookingStatus? status;

  @override
  Widget build(BuildContext context) {
    Widget trailing;
    if (status != null) {
      trailing = _StatusPill(status: status!);
    } else if (highlight) {
      trailing = Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(color: AppColors.zoneSoft, borderRadius: BorderRadius.circular(7)),
        child: Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.ink)),
      );
    } else {
      trailing = Flexible(child: Text(value, textAlign: TextAlign.right,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.ink)));
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 17),
      child: Row(children: [
        Icon(icon, size: 21, color: highlight ? AppColors.deepGreen : AppColors.muted),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: const TextStyle(fontSize: 15, color: AppColors.muted))),
        trailing,
      ]),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});
  final BookingStatus status;

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (status) {
      BookingStatus.seated => (AppColors.mint, AppColors.deepGreen),
      BookingStatus.completed => (AppColors.pale, AppColors.muted),
      BookingStatus.cancelled => (AppColors.rose, AppColors.danger),
      BookingStatus.noShow => (AppColors.blush, AppColors.noShowInk),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(24)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: foreground, shape: BoxShape.circle)),
        const SizedBox(width: 7),
        Text(status.label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: foreground)),
      ]),
    );
  }
}

class _ContactButton extends StatelessWidget {
  const _ContactButton({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.zoneSoft,
    borderRadius: BorderRadius.circular(13),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(13),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 7),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          CircleAvatar(radius: 19, backgroundColor: AppColors.green, child: Icon(icon, size: 20, color: AppColors.white)),
          const SizedBox(width: 9),
          Flexible(child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.ink))),
        ]),
      ),
    ),
  );
}

class _DangerAction extends StatelessWidget {
  const _DangerAction({required this.icon, required this.label, required this.enabled, required this.onTap});
  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 60,
    child: OutlinedButton.icon(
      onPressed: enabled ? onTap : null,
      icon: Icon(icon, color: enabled ? AppColors.danger : AppColors.muted, size: 21),
      label: Text(label, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
        color: enabled ? AppColors.danger : AppColors.muted)),
      style: OutlinedButton.styleFrom(
        backgroundColor: AppColors.pale,
        disabledBackgroundColor: AppColors.previewTrack,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17)),
      ),
    ),
  );
}

class _MessageBanner extends StatelessWidget {
  const _MessageBanner({required this.message, required this.isError});
  final String message;
  final bool isError;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: isError ? AppColors.dangerSoft : AppColors.zoneSoft, borderRadius: BorderRadius.circular(12)),
    child: Text(message, style: TextStyle(color: isError ? AppColors.danger : AppColors.muted)),
  );
}

BoxDecoration _cardDecoration() => BoxDecoration(
  color: AppColors.white,
  borderRadius: BorderRadius.circular(19),
  boxShadow: AppShadows.soft,
);

String _clock(DateTime value) {
  final hour = value.hour % 12 == 0 ? 12 : value.hour % 12;
  final suffix = value.hour >= 12 ? 'PM' : 'AM';
  return '$hour:${value.minute.toString().padLeft(2, '0')} $suffix';
}


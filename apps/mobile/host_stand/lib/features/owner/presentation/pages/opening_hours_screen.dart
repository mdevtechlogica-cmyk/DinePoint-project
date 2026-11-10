import 'package:flutter/material.dart';
import 'package:host_stand/core/api_client.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/session_cache.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/owner/presentation/pages/owner_screens.dart';

class OpeningHoursScreen extends StatefulWidget {
  const OpeningHoursScreen({super.key});

  @override
  State<OpeningHoursScreen> createState() => _OpeningHoursScreenState();
}

class _OpeningHoursScreenState extends State<OpeningHoursScreen> {
  static const _days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  bool _loading = true;
  String? _error;
  late List<_DayHours> _daysState;

  @override
  void initState() {
    super.initState();
    _daysState = List.generate(
      7,
      (i) => _DayHours(dayOfWeek: i, openTime: '10:00', closeTime: '22:00'),
    );
    _load();
  }

  String get _base {
    final session = sl<SessionCache>();
    return '/organizations/${session.organizationId}/restaurants/${session.restaurantId}/opening-hours';
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await sl<ApiClient>().getList(_base);
      final byDay = <int, Map<String, dynamic>>{};
      for (final raw in list.whereType<Map>()) {
        final map = Map<String, dynamic>.from(raw);
        final day = (map['dayOfWeek'] as num?)?.toInt();
        if (day != null) byDay[day] = map;
      }
      setState(() {
        _daysState = List.generate(7, (i) {
          final row = byDay[i];
          if (row == null) {
            return _DayHours(
              dayOfWeek: i,
              openTime: '10:00',
              closeTime: '22:00',
              isClosed: true,
            );
          }
          return _DayHours(
            dayOfWeek: i,
            openTime: (row['openTime'] as String?) ?? '10:00',
            closeTime: (row['closeTime'] as String?) ?? '22:00',
            isClosed: row['isClosed'] as bool? ?? false,
          );
        });
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e is ApiException
            ? e.message
            : 'Could not load opening hours.';
      });
    }
  }

  Future<void> _saveDay(_DayHours day) async {
    try {
      await sl<ApiClient>().put(
        _base,
        body: {
          'dayOfWeek': day.dayOfWeek,
          'isClosed': day.isClosed,
          if (!day.isClosed) ...{
            'openTime': day.openTime,
            'closeTime': day.closeTime,
          },
        },
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${_days[day.dayOfWeek]} saved')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e is ApiException ? e.message : 'Could not save hours.',
          ),
        ),
      );
    }
  }

  Future<TimeOfDay?> _pickTime(TimeOfDay initial) {
    return showTimePicker(context: context, initialTime: initial);
  }

  String _fmt(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  TimeOfDay _parse(String value) {
    final parts = value.split(':');
    return TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 10,
      minute: int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ScreenFrame(
      title: 'Opening hours',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
                  itemCount: _daysState.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final day = _daysState[index];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _days[day.dayOfWeek],
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                              Switch(
                                value: !day.isClosed,
                                activeThumbColor: AppColors.deepGreen,
                                onChanged: (open) {
                                  setState(() {
                                    _daysState[index] =
                                        day.copyWith(isClosed: !open);
                                  });
                                  _saveDay(_daysState[index]);
                                },
                              ),
                              Text(day.isClosed ? 'Closed' : 'Open'),
                            ],
                          ),
                          if (!day.isClosed) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () async {
                                      final picked =
                                          await _pickTime(_parse(day.openTime));
                                      if (picked == null) return;
                                      setState(() {
                                        _daysState[index] = day.copyWith(
                                          openTime: _fmt(picked),
                                        );
                                      });
                                      await _saveDay(_daysState[index]);
                                    },
                                    child: Text('Open ${day.openTime}'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () async {
                                      final picked = await _pickTime(
                                        _parse(day.closeTime),
                                      );
                                      if (picked == null) return;
                                      setState(() {
                                        _daysState[index] = day.copyWith(
                                          closeTime: _fmt(picked),
                                        );
                                      });
                                      await _saveDay(_daysState[index]);
                                    },
                                    child: Text('Close ${day.closeTime}'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}

class _DayHours {
  const _DayHours({
    required this.dayOfWeek,
    required this.openTime,
    required this.closeTime,
    this.isClosed = false,
  });

  final int dayOfWeek;
  final String openTime;
  final String closeTime;
  final bool isClosed;

  _DayHours copyWith({
    String? openTime,
    String? closeTime,
    bool? isClosed,
  }) =>
      _DayHours(
        dayOfWeek: dayOfWeek,
        openTime: openTime ?? this.openTime,
        closeTime: closeTime ?? this.closeTime,
        isClosed: isClosed ?? this.isClosed,
      );
}

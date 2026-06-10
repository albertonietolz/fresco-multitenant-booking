import 'dart:async';
import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class OverviewTab extends StatefulWidget {
  const OverviewTab({super.key});

  @override
  State<OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends State<OverviewTab> {
  List<Booking> _bookings = [];
  List<Service> _services = [];
  List<Employee> _employees = [];
  bool _loading = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.get('/api/bookings'),
        ApiService.get('/api/services'),
        ApiService.get('/api/employees'),
      ]);
      setState(() {
        _bookings = (results[0] as List).map((e) => Booking.fromJson(e)).toList();
        _services = (results[1] as List).map((e) => Service.fromJson(e)).toList();
        _employees = (results[2] as List).map((e) => Employee.fromJson(e)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.blue));

    final now = DateTime.now();
    final todayStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

    final today = _bookings.where((b) => b.date == todayStr && b.status != 'CANCELLED').toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    final todayPending = today.where((b) => b.status == 'PENDING').length;

    final weekEnd = now.add(const Duration(days: 7));
    final thisWeek = _bookings.where((b) {
      final d = DateTime.tryParse(b.date);
      return d != null &&
          d.isAfter(DateTime(now.year, now.month, now.day)) &&
          d.isBefore(weekEnd) &&
          b.status != 'CANCELLED';
    }).length;

    final from = DateTime(now.year, now.month - 1, now.day);
    final recent = _bookings.where((b) {
      final d = DateTime.tryParse(b.date);
      return d != null && d.isAfter(from) && !d.isAfter(now.add(const Duration(days: 1)));
    }).toList();

    final svcMap = {for (var s in _services) s.id: s.name};
    final empMap = {for (var e in _employees) e.id: e.name};

    return RefreshIndicator(
      color: AppTheme.blue,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionLabel('HOY · ${_fmtDate(now)}'),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _kpi('Total hoy', today.length, AppTheme.blue, Icons.calendar_today_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Pendientes', todayPending, AppTheme.warningColor, Icons.schedule_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Esta semana', thisWeek, AppTheme.ochre, Icons.date_range_rounded)),
          ]),
          const SizedBox(height: 24),

          _sectionLabel('AGENDA DE HOY'),
          const SizedBox(height: 10),
          if (today.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: AppTheme.cardDecoration(),
              child: const Column(children: [
                Icon(Icons.event_available, color: AppTheme.stoneBorder, size: 36),
                SizedBox(height: 8),
                Text('Sin reservas hoy', style: TextStyle(color: AppTheme.inkMuted, fontSize: 14)),
              ]),
            )
          else
            ...today.map((b) => _bookingCard(b, svcMap, empMap)),

          const SizedBox(height: 24),
          _sectionLabel('ÚLTIMOS 30 DÍAS'),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _kpi('Total', recent.length, AppTheme.blue, Icons.bar_chart_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Confirmadas', recent.where((b) => b.status == 'CONFIRMED').length, AppTheme.success, Icons.check_circle_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Canceladas', recent.where((b) => b.status == 'CANCELLED').length, AppTheme.errorColor, Icons.cancel_rounded)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _kpi('Servicios', _services.where((s) => s.active).length, AppTheme.ochre, Icons.medical_services_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Empleados', _employees.where((e) => e.active).length, AppTheme.blueMid, Icons.people_rounded)),
            const SizedBox(width: 10),
            const Expanded(child: SizedBox()),
          ]),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  String _fmtDate(DateTime d) {
    const months = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const days = ['', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
    return '${days[d.weekday]} ${d.day} ${months[d.month]}';
  }

  Widget _sectionLabel(String t) => Text(t,
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.inkMuted, letterSpacing: 0.7));

  Widget _kpi(String label, int value, Color color, IconData icon) => Container(
        padding: const EdgeInsets.all(12),
        decoration: AppTheme.cardDecoration(),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 6),
          Text('$value', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: color)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.inkMuted, fontWeight: FontWeight.w500)),
        ]),
      );

  Widget _bookingCard(Booking b, Map svcMap, Map empMap) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: AppTheme.cardDecoration(),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(color: AppTheme.ochreDim, borderRadius: BorderRadius.circular(10)),
            child: Text(b.startTime,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ochre)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(b.customerName,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.ink))),
              if (b.partySize > 1)
                Container(
                  margin: const EdgeInsets.only(left: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppTheme.ochreDim, borderRadius: BorderRadius.circular(10)),
                  child: Text('${b.partySize} personas',
                      style: const TextStyle(fontSize: 10, color: AppTheme.ochre, fontWeight: FontWeight.w600)),
                ),
            ]),
            Text(svcMap[b.serviceId] ?? '—',
                style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
            if (b.employeeId != null && empMap[b.employeeId] != null)
              Text(empMap[b.employeeId]!,
                  style: const TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
          ])),
          _badge(b.status),
        ]),
      );

  Widget _badge(String status) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(20)),
        child: Text(AppTheme.statusLabel(status),
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.statusColor(status))),
      );
}

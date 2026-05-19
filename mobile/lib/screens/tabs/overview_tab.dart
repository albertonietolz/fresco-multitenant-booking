import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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

  @override
  void initState() {
    super.initState();
    _load();
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
    final from = DateTime(now.year, now.month - 1, now.day);
    final recent = _bookings.where((b) {
      final d = DateTime.tryParse(b.date);
      return d != null && d.isAfter(from) && !d.isAfter(now.add(const Duration(days: 1)));
    }).toList();

    final total = recent.length;
    final confirmed = recent.where((b) => b.status == 'CONFIRMED').length;
    final pending = recent.where((b) => b.status == 'PENDING').length;
    final cancelled = recent.where((b) => b.status == 'CANCELLED').length;

    final today = _bookings.where((b) {
      final d = DateTime.tryParse(b.date);
      return d != null && d.year == now.year && d.month == now.month && d.day == now.day;
    }).toList()..sort((a, b) => a.startTime.compareTo(b.startTime));

    final svcMap = {for (var s in _services) s.id: s.name};
    final empMap = {for (var e in _employees) e.id: e.name};

    return RefreshIndicator(
      color: AppTheme.blue,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionLabel('Últimos 30 días'),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _kpi('Total', total, AppTheme.blue, Icons.calendar_month_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Confirmadas', confirmed, AppTheme.success, Icons.check_circle_rounded)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _kpi('Pendientes', pending, AppTheme.warningColor, Icons.schedule_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Canceladas', cancelled, AppTheme.errorColor, Icons.cancel_rounded)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _kpi('Servicios activos', _services.where((s) => s.active).length, AppTheme.ochre, Icons.medical_services_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _kpi('Empleados', _employees.where((e) => e.active).length, AppTheme.blueMid, Icons.people_rounded)),
          ]),
          const SizedBox(height: 24),
          _sectionLabel('Agenda de hoy'),
          const SizedBox(height: 10),
          if (today.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: AppTheme.cardDecoration(),
              child: Column(children: [
                Icon(Icons.event_available, color: AppTheme.stoneBorder, size: 36),
                const SizedBox(height: 8),
                Text('Sin reservas hoy', style: GoogleFonts.dmSans(color: AppTheme.inkMuted, fontSize: 14)),
              ]),
            )
          else
            ...today.map((b) => _bookingCard(b, svcMap, empMap)),
        ],
      ),
    );
  }

  Widget _sectionLabel(String t) => Text(t,
      style: GoogleFonts.dmSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.inkMuted, letterSpacing: 0.7));

  Widget _kpi(String label, int value, Color color, IconData icon) => Container(
        padding: const EdgeInsets.all(14),
        decoration: AppTheme.cardDecoration(),
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: GoogleFonts.dmSans(fontSize: 10, color: AppTheme.inkMuted, fontWeight: FontWeight.w500)),
            Text('$value', style: GoogleFonts.dmSans(fontSize: 22, fontWeight: FontWeight.w700, color: color)),
          ]),
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
            child: Text(b.startTime, style: GoogleFonts.dmSans(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ochre)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(b.customerName, style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.ink)),
            Text(svcMap[b.serviceId] ?? '—', style: GoogleFonts.dmSans(fontSize: 12, color: AppTheme.inkMuted)),
          ])),
          _badge(b.status),
        ]),
      );

  Widget _badge(String status) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(20)),
        child: Text(AppTheme.statusLabel(status),
            style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.statusColor(status))),
      );
}

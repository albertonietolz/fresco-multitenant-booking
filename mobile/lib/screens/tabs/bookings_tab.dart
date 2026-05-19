import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class BookingsTab extends StatefulWidget {
  const BookingsTab({super.key});

  @override
  State<BookingsTab> createState() => _BookingsTabState();
}

class _BookingsTabState extends State<BookingsTab> {
  List<Booking> _all = [];
  List<Service> _services = [];
  List<Employee> _employees = [];
  String _filter = 'ALL';
  bool _loading = true;
  String _search = '';

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
        _all = (results[0] as List).map((e) => Booking.fromJson(e)).toList()
          ..sort((a, b) {
            final dc = b.date.compareTo(a.date);
            return dc != 0 ? dc : a.startTime.compareTo(b.startTime);
          });
        _services = (results[1] as List).map((e) => Service.fromJson(e)).toList();
        _employees = (results[2] as List).map((e) => Employee.fromJson(e)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _changeStatus(Booking b, String newStatus) async {
    try {
      await ApiService.patch('/api/bookings/${b.id}/status', {'status': newStatus});
      await _load();
    } catch (_) {}
  }

  List<Booking> get _filtered {
    var list = _all;
    if (_filter != 'ALL') list = list.where((b) => b.status == _filter).toList();
    if (_search.isNotEmpty) {
      final q = _search.toLowerCase();
      list = list.where((b) => b.customerName.toLowerCase().contains(q) || (b.customerEmail?.toLowerCase().contains(q) ?? false)).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final svcMap = {for (var s in _services) s.id: s.name};
    final empMap = {for (var e in _employees) e.id: e.name};

    return Column(children: [
      Container(
        color: AppTheme.white,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Column(children: [
          TextField(
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              hintText: 'Buscar cliente…',
              hintStyle: const TextStyle(color: AppTheme.inkMuted, fontSize: 13),
              prefixIcon: const Icon(Icons.search, color: AppTheme.inkMuted, size: 20),
              filled: true,
              fillColor: AppTheme.stone,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (final f in [('ALL', 'Todas'), ('PENDING', 'Pendientes'), ('CONFIRMED', 'Confirmadas'), ('CANCELLED', 'Canceladas')])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f.$2),
                    selected: _filter == f.$1,
                    onSelected: (_) => setState(() => _filter = f.$1),
                    selectedColor: AppTheme.blue,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      color: _filter == f.$1 ? AppTheme.white : AppTheme.ink,
                      fontWeight: FontWeight.w500,
                    ),
                    backgroundColor: AppTheme.stone,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                ),
            ]),
          ),
          const SizedBox(height: 8),
        ]),
      ),
      Expanded(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.blue))
            : RefreshIndicator(
                color: AppTheme.blue,
                onRefresh: _load,
                child: _filtered.isEmpty
                    ? const Center(child: Text('Sin reservas', style: TextStyle(color: AppTheme.inkMuted)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) => _tile(_filtered[i], svcMap, empMap),
                      ),
              ),
      ),
    ]);
  }

  Widget _tile(Booking b, Map svcMap, Map empMap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: AppTheme.cardDecoration(),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        leading: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(b.startTime, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.blue)),
          Text(_shortDate(b.date), style: const TextStyle(fontSize: 10, color: AppTheme.inkMuted)),
        ]),
        title: Text(b.customerName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.ink)),
        subtitle: Text(svcMap[b.serviceId] ?? '—', style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
        trailing: _statusBadge(b.status),
        children: [
          if (empMap[b.employeeId] != null)
            _row(Icons.person_outline, empMap[b.employeeId]!),
          if (b.customerEmail != null)
            _row(Icons.email_outlined, b.customerEmail!),
          if (b.customerPhone != null)
            _row(Icons.phone_outlined, b.customerPhone!),
          if (b.notes != null && b.notes!.isNotEmpty)
            _row(Icons.notes, b.notes!),
          const SizedBox(height: 10),
          Row(children: [
            for (final s in ['PENDING', 'CONFIRMED', 'CANCELLED'])
              if (s != b.status)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: OutlinedButton(
                      onPressed: () => _changeStatus(b, s),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.statusColor(s),
                        side: BorderSide(color: AppTheme.statusColor(s).withValues(alpha: 0.5)),
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(AppTheme.statusLabel(s), style: const TextStyle(fontSize: 11)),
                    ),
                  ),
                ),
          ]),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(children: [
          Icon(icon, size: 15, color: AppTheme.inkMuted),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: AppTheme.inkMuted))),
        ]),
      );

  Widget _statusBadge(String status) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(20)),
        child: Text(AppTheme.statusLabel(status),
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.statusColor(status))),
      );

  String _shortDate(String d) {
    try {
      final p = d.split('-');
      const months = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return '${p[2]} ${months[int.parse(p[1])]}';
    } catch (_) {
      return d;
    }
  }
}

import 'dart:async';
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
      await ApiService.patch('/api/bookings/${b.id}/status?status=$newStatus', {});
      await _load();
    } catch (_) {}
  }

  Future<void> _showEditSheet(BuildContext context, Booking b) async {
    final nameCtrl  = TextEditingController(text: b.customerName);
    final emailCtrl = TextEditingController(text: b.customerEmail ?? '');
    final phoneCtrl = TextEditingController(text: b.customerPhone ?? '');
    final notesCtrl = TextEditingController(text: b.notes ?? '');
    String selectedStatus = b.status;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 24, right: 24, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(
                    child: Text('Editar reserva',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.ink)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppTheme.inkMuted),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ]),
                Text('${b.startTime} · ${b.date}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
                const SizedBox(height: 20),
                _formLabel('Nombre del cliente'),
                _formInput(nameCtrl),
                const SizedBox(height: 12),
                _formLabel('Email'),
                _formInput(emailCtrl, keyboard: TextInputType.emailAddress),
                const SizedBox(height: 12),
                _formLabel('Teléfono'),
                _formInput(phoneCtrl, keyboard: TextInputType.phone),
                const SizedBox(height: 12),
                _formLabel('Notas'),
                _formInput(notesCtrl, maxLines: 2),
                const SizedBox(height: 12),
                _formLabel('Estado'),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.stone,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: DropdownButton<String>(
                    value: selectedStatus,
                    isExpanded: true,
                    underline: const SizedBox.shrink(),
                    items: const [
                      DropdownMenuItem(value: 'PENDING',   child: Text('Pendiente')),
                      DropdownMenuItem(value: 'CONFIRMED', child: Text('Confirmada')),
                      DropdownMenuItem(value: 'CANCELLED', child: Text('Cancelada')),
                    ],
                    onChanged: (v) => setSheetState(() => selectedStatus = v!),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      try {
                        await ApiService.patch('/api/bookings/${b.id}', {
                          'customerName':  nameCtrl.text.trim(),
                          'customerEmail': emailCtrl.text.trim().isEmpty ? null : emailCtrl.text.trim(),
                          'customerPhone': phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                          'notes':         notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
                          'status':        selectedStatus,
                        });
                        if (ctx.mounted) Navigator.pop(ctx);
                        await _load();
                      } catch (_) {}
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.blue,
                      foregroundColor: AppTheme.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Guardar cambios',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _formLabel(String label) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.inkMuted)),
  );

  Widget _formInput(TextEditingController ctrl, {TextInputType? keyboard, int maxLines = 1}) =>
    TextField(
      controller: ctrl,
      keyboardType: keyboard,
      maxLines: maxLines,
      decoration: InputDecoration(
        filled: true,
        fillColor: AppTheme.stone,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
    );

  Future<void> _showOnDuty(BuildContext context, Booking b) async {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => const Center(child: CircularProgressIndicator(color: AppTheme.blue)),
    );
    try {
      final data = await ApiService.get('/api/bookings/${b.id}/on-duty');
      if (!context.mounted) return;
      Navigator.of(context).pop();
      final emps = (data as List).cast<Map<String, dynamic>>();
      showModalBottomSheet(
        context: context,
        backgroundColor: AppTheme.white,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        builder: (_) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Empleados en turno', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.ink)),
            const SizedBox(height: 4),
            Text(
              '${b.startTime} · ${b.date}',
              style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted),
            ),
            const SizedBox(height: 16),
            if (emps.isEmpty)
              const Text('Ningún empleado tiene turno en ese horario.', style: TextStyle(color: AppTheme.inkMuted, fontSize: 13))
            else
              ...emps.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppTheme.blue.withValues(alpha: 0.12),
                    child: Text(
                      _initials(e['name'] as String? ?? '?'),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.blue),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(e['name'] as String? ?? '—', style: const TextStyle(fontSize: 14, color: AppTheme.ink)),
                ]),
              )),
            const SizedBox(height: 8),
          ]),
        ),
      );
    } catch (_) {
      if (context.mounted) Navigator.of(context).pop();
    }
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
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
    final isUnassigned = b.employeeId == null;

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
          if (!isUnassigned && empMap[b.employeeId] != null)
            _row(Icons.person_outline, empMap[b.employeeId]!),
          if (isUnassigned)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: () => _showOnDuty(context, b),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: AppTheme.blue.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.blue.withValues(alpha: 0.2)),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.people_outline, size: 15, color: AppTheme.blue),
                    const SizedBox(width: 6),
                    const Text('Ver empleados en turno', style: TextStyle(fontSize: 12, color: AppTheme.blue, fontWeight: FontWeight.w600)),
                  ]),
                ),
              ),
            ),
          if (b.partySize > 1)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(children: [
                const Icon(Icons.people_outline, size: 15, color: AppTheme.ochre),
                const SizedBox(width: 8),
                Text('${b.partySize} personas', style: const TextStyle(fontSize: 13, color: AppTheme.ochre, fontWeight: FontWeight.w600)),
              ]),
            ),
          if (b.customerEmail != null)
            _row(Icons.email_outlined, b.customerEmail!),
          if (b.customerPhone != null)
            _row(Icons.phone_outlined, b.customerPhone!),
          if (b.notes != null && b.notes!.isNotEmpty)
            _row(Icons.notes, b.notes!),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _showEditSheet(context, b),
              icon: const Icon(Icons.edit_outlined, size: 15),
              label: const Text('Editar datos', style: TextStyle(fontSize: 12)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.blue,
                side: BorderSide(color: AppTheme.blue.withValues(alpha: 0.35)),
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          const SizedBox(height: 8),
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

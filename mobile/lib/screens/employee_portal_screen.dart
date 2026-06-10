import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class EmployeePortalScreen extends StatefulWidget {
  final String slug;
  const EmployeePortalScreen({super.key, this.slug = 'fisiovital'});

  @override
  State<EmployeePortalScreen> createState() => _EmployeePortalScreenState();
}

class _EmployeePortalScreenState extends State<EmployeePortalScreen> {
  int _step = 0; // 0=employee, 1=pin, 2=schedule

  List<Employee> _employees = [];
  Employee? _selected;
  final _pinCtrl = TextEditingController();
  List<ScheduleBookingSlot> _schedule = [];
  DateTime _currentDate = DateTime.now();
  String? _empToken;
  bool _loading = false;
  String? _error;
  Timer? _pollTimer;

  String get _dateStr {
    final d = _currentDate;
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  Future<void> _loadEmployees() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.pubGet('/${widget.slug}/employee/staff');
      setState(() {
        _employees = (data as List).map((e) => Employee.fromJson(e)).where((e) => e.active).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() { _error = 'Negocio no encontrado'; _loading = false; });
    }
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.pubPost('/${widget.slug}/employee/login', {
        'employeeId': _selected!.id,
        'pin': _pinCtrl.text.trim(),
      });
      if (data['token'] != null) {
        _empToken = data['token'] as String;
        await _loadSchedule();
        setState(() => _step = 2);
        _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadSchedule());
      } else {
        setState(() { _error = 'PIN incorrecto'; _loading = false; });
      }
    } catch (_) {
      setState(() { _error = 'PIN incorrecto'; _loading = false; });
    }
  }

  Future<void> _loadSchedule() async {
    setState(() => _loading = true);
    try {
      final res = await http.get(
        Uri.parse('${ApiService.baseUrl}/emp/my-bookings?date=$_dateStr'),
        headers: {'Authorization': 'Bearer $_empToken', 'Content-Type': 'application/json'},
      );
      final data = jsonDecode(utf8.decode(res.bodyBytes)) as List;
      setState(() {
        _schedule = data
            .map((b) => ScheduleBookingSlot.fromJson(b as Map<String, dynamic>))
            .toList()
          ..sort((a, b) => a.startTime.compareTo(b.startTime));
        _loading = false;
      });
    } catch (_) {
      setState(() { _schedule = []; _loading = false; });
    }
  }

  void _goToDate(DateTime d) {
    setState(() => _currentDate = d);
    _pollTimer?.cancel();
    _loadSchedule();
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadSchedule());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _pinCtrl.dispose();
    super.dispose();
  }

  void _showBookingDetail(int bookingId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _BookingDetailSheet(
        bookingId: bookingId,
        empToken: _empToken!,
        onStatusChanged: () {
          Navigator.pop(ctx);
          _loadSchedule();
        },
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.stone,
      body: Column(children: [
        _header(),
        Expanded(child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.blue))
            : _body()),
      ]),
    );
  }

  Widget _header() {
    final titles = ['Selecciona tu nombre', 'Introduce tu PIN', 'Tu agenda'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 56, 24, 24),
      decoration: const BoxDecoration(
        color: AppTheme.blue,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (_step > 0 || context.canPop())
          GestureDetector(
            onTap: () {
              if (_step == 0) {
                context.pop();
              } else {
                setState(() { _step = _step - 1; _error = null; });
              }
            },
            child: const Row(children: [
              Icon(Icons.arrow_back, color: AppTheme.white, size: 20),
              SizedBox(width: 6),
              Text('Volver', style: TextStyle(color: AppTheme.white, fontSize: 13)),
            ]),
          ),
        const SizedBox(height: 16),
        if (_selected != null && _step >= 1)
          Text(_selected!.name,
              style: TextStyle(fontSize: 12, color: AppTheme.white.withValues(alpha: 0.6))),
        Text(titles[_step.clamp(0, 2)],
            style: const TextStyle(fontFamily: 'Georgia', fontSize: 22,
                fontWeight: FontWeight.w600, color: AppTheme.white)),
        if (_step == 2) ...[
          const SizedBox(height: 4),
          Text(_fmtDateLong(_currentDate),
              style: TextStyle(fontSize: 13, color: AppTheme.white.withValues(alpha: 0.7))),
        ],
      ]),
    );
  }

  Widget _body() {
    switch (_step) {
      case 0: return _stepEmployee();
      case 1: return _stepPin();
      case 2: return _stepSchedule();
      default: return const SizedBox();
    }
  }

  // ── Step 0: Seleccionar empleado ─────────────────────────────────────────

  Widget _stepEmployee() => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _employees.length,
        itemBuilder: (_, i) {
          final e = _employees[i];
          return GestureDetector(
            onTap: () => setState(() { _selected = e; _step = 1; _pinCtrl.clear(); _error = null; }),
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(),
              child: Row(children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: AppTheme.blue.withValues(alpha: 0.1),
                  child: Text(_initials(e.name),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.blue)),
                ),
                const SizedBox(width: 14),
                Expanded(child: Text(e.name,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.ink))),
                const Icon(Icons.chevron_right, color: AppTheme.stoneBorder),
              ]),
            ),
          );
        },
      );

  // ── Step 1: PIN ──────────────────────────────────────────────────────────

  Widget _stepPin() => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const SizedBox(height: 8),
          if (_error != null) _errorBox(_error!),
          const Text('PIN de acceso',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.ink)),
          const SizedBox(height: 6),
          TextField(
            controller: _pinCtrl,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 8,
            decoration: _inputDec('••••••••'),
          ),
          const SizedBox(height: 20),
          _btn('Entrar', _login),
        ]),
      );

  // ── Step 2: Agenda ───────────────────────────────────────────────────────

  Widget _stepSchedule() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    // Generar 7 días centrados en la semana actual del _currentDate
    final weekStart = _currentDate.subtract(Duration(days: _currentDate.weekday - 1));
    final dates = List.generate(7, (i) => weekStart.add(Duration(days: i)));

    return Column(children: [
      // Navegación de semana
      Container(
        color: AppTheme.white,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(children: [
          IconButton(
            icon: const Icon(Icons.chevron_left, color: AppTheme.ink),
            onPressed: () => _goToDate(_currentDate.subtract(const Duration(days: 7))),
          ),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: dates.map((d) {
                const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                final isToday = d.year == today.year && d.month == today.month && d.day == today.day;
                final isSelected = d.year == _currentDate.year && d.month == _currentDate.month && d.day == _currentDate.day;
                return GestureDetector(
                  onTap: () => _goToDate(d),
                  child: Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.blue : isToday ? AppTheme.ochreDim : AppTheme.stone,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: isSelected ? AppTheme.blue
                              : isToday ? AppTheme.ochre
                              : AppTheme.stoneBorder),
                    ),
                    child: Column(children: [
                      Text(days[d.weekday], style: TextStyle(
                          fontSize: 10,
                          color: isSelected ? AppTheme.white.withValues(alpha: 0.7)
                              : isToday ? AppTheme.ochre
                              : AppTheme.inkMuted)),
                      Text('${d.day}', style: TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w700,
                          color: isSelected ? AppTheme.white
                              : isToday ? AppTheme.ochre
                              : AppTheme.ink)),
                    ]),
                  ),
                );
              }).toList()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: AppTheme.ink),
            onPressed: () => _goToDate(_currentDate.add(const Duration(days: 7))),
          ),
        ]),
      ),
      // Lista de citas
      Expanded(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.blue))
            : _schedule.isEmpty
                ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.event_available_outlined, size: 48, color: AppTheme.stoneBorder),
                    const SizedBox(height: 12),
                    const Text('Sin citas para este día',
                        style: TextStyle(color: AppTheme.inkMuted, fontSize: 15)),
                  ]))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _schedule.length,
                    itemBuilder: (_, i) => _scheduleTile(_schedule[i]),
                  ),
      ),
    ]);
  }

  Widget _scheduleTile(ScheduleBookingSlot s) {
    final isCancelled = s.status == 'CANCELLED';
    return GestureDetector(
      onTap: s.id > 0 ? () => _showBookingDetail(s.id) : null,
      child: Opacity(
        opacity: isCancelled ? 0.5 : 1.0,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: AppTheme.cardDecoration(),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(color: AppTheme.ochreDim, borderRadius: BorderRadius.circular(8)),
              child: Column(children: [
                Text(s.startTime.substring(0, 5),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ochre)),
                Text(s.endTime.substring(0, 5),
                    style: const TextStyle(fontSize: 10, color: AppTheme.ochre)),
              ]),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(s.clientName,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.ink)),
              const SizedBox(height: 2),
              Text(s.serviceName,
                  style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                    color: AppTheme.statusBg(s.status), borderRadius: BorderRadius.circular(20)),
                child: Text(AppTheme.statusLabel(s.status),
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600,
                        color: AppTheme.statusColor(s.status))),
              ),
              if (!isCancelled) ...[
                const SizedBox(height: 4),
                const Icon(Icons.chevron_right, size: 16, color: AppTheme.stoneBorder),
              ],
            ]),
          ]),
        ),
      ),
    );
  }

  // ── Widgets de apoyo ─────────────────────────────────────────────────────

  Widget _btn(String label, VoidCallback onTap) => SizedBox(
        height: 50,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.blue,
            foregroundColor: AppTheme.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          child: Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        ),
      );

  Widget _errorBox(String msg) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppTheme.errorDim, borderRadius: BorderRadius.circular(10)),
        child: Text(msg, style: const TextStyle(color: AppTheme.errorColor, fontSize: 13)),
      );

  InputDecoration _inputDec(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppTheme.inkMuted, fontSize: 13),
        filled: true,
        fillColor: AppTheme.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppTheme.stoneBorder)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppTheme.stoneBorder)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppTheme.blue, width: 1.5)),
      );

  String _fmtDateLong(DateTime d) {
    const months = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const days = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    return '${days[d.weekday]}, ${d.day} de ${months[d.month]}';
  }
}

// ── Hoja de detalle de reserva ───────────────────────────────────────────────

class _BookingDetailSheet extends StatefulWidget {
  final int bookingId;
  final String empToken;
  final VoidCallback onStatusChanged;

  const _BookingDetailSheet({
    required this.bookingId,
    required this.empToken,
    required this.onStatusChanged,
  });

  @override
  State<_BookingDetailSheet> createState() => _BookingDetailSheetState();
}

class _BookingDetailSheetState extends State<_BookingDetailSheet> {
  Map<String, dynamic>? _detail;
  bool _loading = true;
  String? _error;
  bool _updating = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      final res = await http.get(
        Uri.parse('${ApiService.baseUrl}/emp/bookings/${widget.bookingId}'),
        headers: {'Authorization': 'Bearer ${widget.empToken}', 'Content-Type': 'application/json'},
      );
      if (res.statusCode == 200) {
        setState(() { _detail = jsonDecode(utf8.decode(res.bodyBytes)); _loading = false; });
      } else {
        setState(() { _error = 'Error al cargar el detalle'; _loading = false; });
      }
    } catch (_) {
      setState(() { _error = 'Error de conexión'; _loading = false; });
    }
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _updating = true);
    try {
      await http.patch(
        Uri.parse('${ApiService.baseUrl}/emp/bookings/${widget.bookingId}/status?status=$status'),
        headers: {'Authorization': 'Bearer ${widget.empToken}', 'Content-Type': 'application/json'},
      );
      widget.onStatusChanged();
    } catch (_) {
      setState(() => _updating = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Error al actualizar el estado')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40, height: 4,
            decoration: BoxDecoration(color: AppTheme.stoneBorder, borderRadius: BorderRadius.circular(2)),
          ),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator(color: AppTheme.blue)))
          else if (_error != null)
            Expanded(child: Center(child: Text(_error!, style: const TextStyle(color: AppTheme.errorColor))))
          else
            Expanded(child: _content(ctrl)),
        ]),
      ),
    );
  }

  Widget _content(ScrollController ctrl) {
    final d = _detail!;
    final status = d['status'] as String? ?? 'CONFIRMED';
    final phone = d['customerPhone'] as String?;
    final email = d['customerEmail'] as String?;
    final notes = d['notes'] as String?;
    final partySize = d['partySize'] as int? ?? 1;
    final fields = (d['fields'] as List? ?? []);
    final visits = d['previousVisits'] as int? ?? 0;
    final isCancelled = status == 'CANCELLED';

    return ListView(
      controller: ctrl,
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
      children: [
        // Cabecera: nombre + badge
        Row(children: [
          Expanded(
            child: Text(d['customerName'] ?? '',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.ink,
                    fontFamily: 'Georgia')),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
                color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(20)),
            child: Text(AppTheme.statusLabel(status),
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                    color: AppTheme.statusColor(status))),
          ),
        ]),
        if (visits > 0) ...[
          const SizedBox(height: 4),
          Text('$visits visita${visits > 1 ? "s" : ""} anterior${visits > 1 ? "es" : ""}',
              style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
        ],
        const SizedBox(height: 16),

        // Servicio + fecha + hora
        _detailCard([
          _row(Icons.content_cut_rounded, d['serviceName'] ?? ''),
          _row(Icons.calendar_today_outlined,
              '${d['date']}  ·  ${(d['startTime'] as String).substring(0, 5)} – ${(d['endTime'] as String).substring(0, 5)}'),
          if (partySize > 1)
            _row(Icons.group_outlined, '$partySize personas'),
        ]),

        // Contacto
        if (phone != null || email != null) ...[
          const SizedBox(height: 12),
          _detailCard([
            if (phone != null)
              _contactRow(Icons.phone_outlined, phone,
                onTap: () async {
                  final uri = Uri.parse('tel:$phone');
                  if (await canLaunchUrl(uri)) launchUrl(uri);
                },
                onLongPress: () {
                  Clipboard.setData(ClipboardData(text: phone));
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Teléfono copiado')));
                },
              ),
            if (email != null)
              _contactRow(Icons.email_outlined, email, onTap: () async {
                final uri = Uri.parse('mailto:$email');
                if (await canLaunchUrl(uri)) launchUrl(uri);
              }),
          ]),
        ],

        // Notas
        if (notes != null && notes.isNotEmpty) ...[
          const SizedBox(height: 12),
          _detailCard([
            _row(Icons.notes_rounded, notes),
          ]),
        ],

        // Campos personalizados
        if (fields.isNotEmpty) ...[
          const SizedBox(height: 12),
          _detailCard(fields.map<Widget>((f) =>
            _row(Icons.label_outline, '${f['label']}: ${f['value']}')).toList()),
        ],

        // Acciones
        if (!isCancelled && !_updating) ...[
          const SizedBox(height: 24),
          if (status != 'COMPLETED')
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.check_circle_outline, size: 18),
                label: const Text('Marcar como completada'),
                onPressed: () => _updateStatus('COMPLETED'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.success,
                  foregroundColor: AppTheme.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
            ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.cancel_outlined, size: 18),
              label: const Text('Cancelar reserva'),
              onPressed: () => _confirmCancel(),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.errorColor,
                side: const BorderSide(color: AppTheme.errorColor),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
        if (_updating)
          const Padding(
            padding: EdgeInsets.only(top: 24),
            child: Center(child: CircularProgressIndicator(color: AppTheme.blue)),
          ),
      ],
    );
  }

  void _confirmCancel() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancelar reserva'),
        content: const Text('¿Estás seguro de que quieres cancelar esta reserva?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('No')),
          TextButton(
            onPressed: () { Navigator.pop(ctx); _updateStatus('CANCELLED'); },
            child: const Text('Sí, cancelar', style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }

  Widget _detailCard(List<Widget> children) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.stone,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.stoneBorder),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
      );

  Widget _row(IconData icon, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 16, color: AppTheme.inkMuted),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14, color: AppTheme.ink))),
        ]),
      );

  Widget _contactRow(IconData icon, String text,
      {required VoidCallback onTap, VoidCallback? onLongPress}) =>
      GestureDetector(
        onTap: onTap,
        onLongPress: onLongPress,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(children: [
            Icon(icon, size: 16, color: AppTheme.blue),
            const SizedBox(width: 10),
            Expanded(
              child: Text(text, style: const TextStyle(fontSize: 14, color: AppTheme.blue,
                  decoration: TextDecoration.underline)),
            ),
          ]),
        ),
      );
}

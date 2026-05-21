import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class BookingFlowScreen extends StatefulWidget {
  final String slug;
  const BookingFlowScreen({super.key, this.slug = 'fisiovital'});

  @override
  State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  int _step = 1; // 1=service, 2=employee, 3=date, 4=details, 5=done

  Tenant? _tenant;
  List<Service> _services = [];
  List<Employee> _employees = [];
  List<String> _slots = [];
  List<String> _availDates = [];

  Service? _service;
  Employee? _employee;
  String _date = '';
  String _slot = '';

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  bool _loading = false;
  String? _error;

  DateTime _calDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadTenant();
  }

  Future<void> _loadTenant() async {
    setState(() { _loading = true; _error = null; });
    try {
      final slug = widget.slug;
      final results = await Future.wait([
        ApiService.pubGet('/$slug/booking/info'),
        ApiService.pubGet('/$slug/booking/services'),
      ]);
      setState(() {
        _tenant = Tenant.fromJson(results[0]);
        _services = (results[1] as List).map((e) => Service.fromJson(e)).where((s) => s.active).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() { _error = 'Negocio no encontrado.'; _loading = false; });
    }
  }

  Future<void> _loadEmployees() async {
    setState(() => _loading = true);
    try {
      final slug = widget.slug;
      final data = await ApiService.pubGet('/$slug/booking/employees/${_service!.id}');
      final emps = (data as List).map((e) => Employee.fromJson(e)).where((e) => e.active).toList();
      setState(() {
        _employees = emps;
        _loading = false;
      });
      if (!(_tenant?.allowEmployeeChoice ?? true)) {
        _employee = Employee(id: null, name: '', active: true, serviceIds: [], hasPinSet: false);
        setState(() => _step = 3);
        _loadAvailDates();
      } else if (emps.length == 1) {
        _employee = emps.first;
        setState(() => _step = 3);
        _loadAvailDates();
      } else {
        setState(() => _step = 2);
      }
    } catch (_) {
      setState(() { _loading = false; _step = 3; });
    }
  }

  Future<void> _loadAvailDates() async {
    if (_service == null || _employee == null) return;
    final slug = widget.slug;
    try {
      final empParam = _employee?.id != null ? '&employeeId=${_employee!.id}' : '';
      final data = await ApiService.pubGet(
          '/$slug/booking/availability/month?serviceId=${_service!.id}$empParam&year=${_calDate.year}&month=${_calDate.month}');
      setState(() => _availDates = (data as List).map((e) => e.toString()).toList());
    } catch (_) {}
  }

  Future<void> _loadSlots() async {
    if (_service == null || _employee == null || _date.isEmpty) return;
    final slug = widget.slug;
    setState(() => _slots = []);
    try {
      final empParamS = _employee?.id != null ? '&employeeId=${_employee!.id}' : '';
      final data = await ApiService.pubGet(
          '/$slug/booking/availability?serviceId=${_service!.id}$empParamS&date=$_date');
      setState(() => _slots = (data['slots'] as List).map((e) => e.toString()).toList());
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'El nombre es obligatorio');
      return;
    }
    if (_phoneCtrl.text.trim().isEmpty) {
      setState(() => _error = 'El teléfono es obligatorio');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final slug = widget.slug;
      await ApiService.pubPost('/$slug/booking', {
        'serviceId': _service!.id,
        'employeeId': _employee?.id,
        'date': _date,
        'startTime': '$_slot:00',
        'customerName': _nameCtrl.text.trim(),
        'customerEmail': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
        'customerPhone': _phoneCtrl.text.trim(),
        'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        'fieldValues': [],
      });
      setState(() { _step = 5; _loading = false; });
    } catch (_) {
      setState(() { _error = 'Error al confirmar la reserva'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.stone,
      body: Column(children: [
        _header(),
        Expanded(child: _body()),
      ]),
    );
  }

  Widget _header() {
    final titles = ['Reservar cita', 'Elige el servicio', 'Elige profesional', 'Fecha y hora', 'Tus datos', '¡Reserva confirmada!'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 56, 24, 24),
      decoration: const BoxDecoration(
        color: AppTheme.blue,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (_step > 1)
          GestureDetector(
            onTap: () => setState(() => _step = _step - 1),
            child: const Row(children: [
              Icon(Icons.arrow_back, color: AppTheme.white, size: 20),
              SizedBox(width: 6),
              Text('Volver', style: TextStyle(color: AppTheme.white, fontSize: 13)),
            ]),
          )
        else if (context.canPop())
          GestureDetector(
            onTap: () => context.pop(),
            child: const Row(children: [
              Icon(Icons.arrow_back, color: AppTheme.white, size: 20),
              SizedBox(width: 6),
              Text('Volver', style: TextStyle(color: AppTheme.white, fontSize: 13)),
            ]),
          ),
        const SizedBox(height: 16),
        if (_tenant != null && _step > 0)
          Text(_tenant!.name, style: TextStyle(fontSize: 12, color: AppTheme.white.withValues(alpha: 0.6), letterSpacing: 0.5)),
        Text(titles[_step.clamp(0, 5)],
            style: const TextStyle(fontFamily: 'Georgia', fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.white)),
        if (_step > 0 && _step < 5)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: LinearProgressIndicator(
              value: _step / 4,
              backgroundColor: AppTheme.white.withValues(alpha: 0.2),
              color: AppTheme.ochre,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
      ]),
    );
  }

  Widget _body() {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.blue));
    switch (_step) {
      case 1: return _stepService();
      case 2: return _stepEmployee();
      case 3: return _stepDateTime();
      case 4: return _stepDetails();
      case 5: return _stepDone();
      default: return const SizedBox();
    }
  }

  Widget _stepService() => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _services.length,
        itemBuilder: (_, i) {
          final s = _services[i];
          return GestureDetector(
            onTap: () {
              setState(() => _service = s);
              _loadEmployees();
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(),
              child: Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(s.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.ink)),
                  const SizedBox(height: 4),
                  Text('Aprox. ${s.duration} min', style: const TextStyle(fontSize: 13, color: AppTheme.inkMuted)),
                ])),
                if (s.price != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: AppTheme.ochreDim, borderRadius: BorderRadius.circular(20)),
                    child: Text('${s.price!.toStringAsFixed(2)} €',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.ochre)),
                  ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, color: AppTheme.stoneBorder),
              ]),
            ),
          );
        },
      );

  Widget _stepEmployee() => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _employees.length,
        itemBuilder: (_, i) {
          final e = _employees[i];
          final initials = e.name.split(' ').map((w) => w[0]).take(2).join().toUpperCase();
          return GestureDetector(
            onTap: () {
              setState(() { _employee = e; _step = 3; });
              _loadAvailDates();
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(),
              child: Row(children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: AppTheme.blue.withValues(alpha: 0.1),
                  child: Text(initials, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.blue)),
                ),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(e.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.ink)),
                  if (e.email != null)
                    Text(e.email!, style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
                ])),
                const Icon(Icons.chevron_right, color: AppTheme.stoneBorder),
              ]),
            ),
          );
        },
      );

  Widget _stepDateTime() {
    final now = DateTime.now();
    final daysInMonth = DateTime(_calDate.year, _calDate.month + 1, 0).day;
    final firstWeekday = DateTime(_calDate.year, _calDate.month, 1).weekday;
    const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AppTheme.cardDecoration(),
          child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {
                  setState(() => _calDate = DateTime(_calDate.year, _calDate.month - 1));
                  _loadAvailDates();
                },
              ),
              Text('${_monthName(_calDate.month)} ${_calDate.year}',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.ink)),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {
                  setState(() => _calDate = DateTime(_calDate.year, _calDate.month + 1));
                  _loadAvailDates();
                },
              ),
            ]),
            const SizedBox(height: 8),
            Row(children: weekdays.map((d) => Expanded(
              child: Center(child: Text(d, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.inkMuted))),
            )).toList()),
            const SizedBox(height: 4),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 1),
              itemCount: (firstWeekday - 1) + daysInMonth,
              itemBuilder: (_, idx) {
                if (idx < firstWeekday - 1) return const SizedBox();
                final day = idx - (firstWeekday - 1) + 1;
                final d = DateTime(_calDate.year, _calDate.month, day);
                final dateStr = '${_calDate.year}-${_calDate.month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
                final isPast = d.isBefore(DateTime(now.year, now.month, now.day));
                final isAvail = _availDates.contains(dateStr);
                final isSelected = _date == dateStr;

                return GestureDetector(
                  onTap: isPast || !isAvail ? null : () {
                    setState(() { _date = dateStr; _slot = ''; });
                    _loadSlots();
                  },
                  child: Container(
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.blue : isAvail ? AppTheme.ochreDim : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(child: Text(
                      '$day',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                        color: isSelected ? AppTheme.white : isPast ? AppTheme.stoneBorder : isAvail ? AppTheme.ochre : AppTheme.ink,
                      ),
                    )),
                  ),
                );
              },
            ),
          ]),
        ),
        if (_date.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: AppTheme.cardDecoration(),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Hora disponible', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.ink)),
              const SizedBox(height: 12),
              if (_slots.isEmpty)
                const Text('Sin horas disponibles para este día.', style: TextStyle(color: AppTheme.inkMuted))
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _slots.map((s) {
                    final t = s.length >= 5 ? s.substring(0, 5) : s;
                    final selected = _slot == t;
                    return GestureDetector(
                      onTap: () => setState(() => _slot = t),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: selected ? AppTheme.blue : AppTheme.stone,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: selected ? AppTheme.blue : AppTheme.stoneBorder),
                        ),
                        child: Text(t, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: selected ? AppTheme.white : AppTheme.ink)),
                      ),
                    );
                  }).toList(),
                ),
            ]),
          ),
          if (_slot.isNotEmpty) ...[
            const SizedBox(height: 16),
            _primaryBtn('Continuar', () => setState(() => _step = 4)),
          ],
        ],
      ]),
    );
  }

  Widget _stepDetails() => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: AppTheme.cardDecoration(bg: AppTheme.ochreDim),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _summaryRow('Servicio', _service!.name),
              _summaryRow('Profesional', _employee!.name),
              _summaryRow('Fecha', _date),
              _summaryRow('Hora', _slot),
              if (_service!.price != null) _summaryRow('Precio', '${_service!.price!.toStringAsFixed(2)} €'),
            ]),
          ),
          const SizedBox(height: 16),
          if (_error != null) _errorBox(_error!),
          _fieldLabel('Nombre completo *'),
          TextField(controller: _nameCtrl, decoration: _inputDec('Tu nombre y apellidos')),
          const SizedBox(height: 12),
          _fieldLabel('Email'),
          TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: _inputDec('tu@email.com')),
          const SizedBox(height: 12),
          _fieldLabel('Teléfono *'),
          TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: _inputDec('6XX XXX XXX')),
          const SizedBox(height: 12),
          _fieldLabel('Notas (opcional)'),
          TextField(controller: _notesCtrl, maxLines: 3, decoration: _inputDec('Observaciones adicionales…')),
          const SizedBox(height: 24),
          _primaryBtn(_loading ? 'Confirmando…' : 'Confirmar reserva', _loading ? () {} : _submit),
        ]),
      );

  Widget _stepDone() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(color: AppTheme.successDim, shape: BoxShape.circle),
              child: const Icon(Icons.check, color: AppTheme.success, size: 36),
            ),
            const SizedBox(height: 20),
            const Text('¡Reserva confirmada!',
                style: TextStyle(fontFamily: 'Georgia', fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.ink)),
            const SizedBox(height: 8),
            Text('Recibirás la confirmación en ${_emailCtrl.text.isNotEmpty ? _emailCtrl.text : "tu email"}.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: AppTheme.inkMuted)),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(),
              child: Column(children: [
                _summaryRow('Servicio', _service?.name ?? ''),
                _summaryRow('Profesional', _employee?.name ?? ''),
                _summaryRow('Fecha', _date),
                _summaryRow('Hora', _slot),
              ]),
            ),
            const SizedBox(height: 24),
            _primaryBtn('Nueva reserva', () => setState(() {
              _step = 1; _service = null; _employee = null; _date = ''; _slot = '';
              _nameCtrl.clear(); _emailCtrl.clear(); _phoneCtrl.clear(); _notesCtrl.clear();
            })),
          ]),
        ),
      );

  Widget _summaryRow(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.inkMuted)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.ink)),
        ]),
      );

  Widget _primaryBtn(String label, VoidCallback onTap) => SizedBox(
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

  Widget _fieldLabel(String label) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.ink)),
      );

  InputDecoration _inputDec(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppTheme.inkMuted, fontSize: 13),
        filled: true,
        fillColor: AppTheme.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.blue, width: 1.5)),
      );

  String _monthName(int m) {
    const names = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return names[m];
  }
}

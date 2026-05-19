import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
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
  String _date = '';
  String? _empToken;
  bool _loading = false;
  String? _error;

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
      final slug = widget.slug;
      final data = await ApiService.pubPost('/$slug/employee/login', {
        'employeeId': _selected!.id,
        'pin': _pinCtrl.text.trim(),
      });
      if (data['success'] == true || data['token'] != null) {
        _empToken = data['token'] as String?;
        final now = DateTime.now();
        _date = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
        await _loadSchedule();
        setState(() => _step = 2);
      } else {
        setState(() { _error = 'PIN incorrecto'; _loading = false; });
      }
    } catch (_) {
      setState(() { _error = 'PIN incorrecto'; _loading = false; });
    }
  }

  Future<void> _loadSchedule() async {
    try {
      final res = await http.get(
        Uri.parse('${ApiService.baseUrl}/emp/schedule?date=$_date'),
        headers: {
          'Authorization': 'Bearer $_empToken',
          'Content-Type': 'application/json',
        },
      );
      final data = jsonDecode(utf8.decode(res.bodyBytes));
      final employees = data['employees'] as List? ?? [];
      final mySchedule = employees.firstWhere(
        (e) => e['id'] == _selected!.id,
        orElse: () => {'bookings': []},
      );
      setState(() {
        _schedule = (mySchedule['bookings'] as List? ?? [])
            .map((b) => ScheduleBookingSlot.fromJson(b))
            .toList()
          ..sort((a, b) => a.startTime.compareTo(b.startTime));
        _loading = false;
      });
    } catch (_) {
      setState(() { _schedule = []; _loading = false; });
    }
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
          Text(_selected!.name, style: TextStyle(fontSize: 12, color: AppTheme.white.withValues(alpha: 0.6))),
        Text(titles[_step.clamp(0, 2)],
            style: const TextStyle(fontFamily: 'Georgia', fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.white)),
        if (_step == 2)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(_date, style: TextStyle(fontSize: 13, color: AppTheme.white.withValues(alpha: 0.7))),
          ),
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
                  child: Text(_initials(e.name), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.blue)),
                ),
                const SizedBox(width: 14),
                Expanded(child: Text(e.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.ink))),
                const Icon(Icons.chevron_right, color: AppTheme.stoneBorder),
              ]),
            ),
          );
        },
      );

  Widget _stepPin() => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const SizedBox(height: 8),
          if (_error != null) _errorBox(_error!),
          const Text('PIN de acceso', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.ink)),
          const SizedBox(height: 6),
          TextField(
            controller: _pinCtrl,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 6,
            decoration: _inputDec('••••'),
          ),
          const SizedBox(height: 20),
          _btn('Entrar', _login),
        ]),
      );

  Widget _stepSchedule() {
    final now = DateTime.now();
    final dates = List.generate(7, (i) {
      final d = now.add(Duration(days: i));
      return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    });

    return Column(children: [
      Container(
        color: AppTheme.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: dates.map((d) {
            final parts = d.split('-');
            final dt = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
            const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            final selected = _date == d;
            return GestureDetector(
              onTap: () {
                setState(() { _date = d; _loading = true; });
                _loadSchedule();
              },
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: selected ? AppTheme.blue : AppTheme.stone,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: selected ? AppTheme.blue : AppTheme.stoneBorder),
                ),
                child: Column(children: [
                  Text(days[dt.weekday], style: TextStyle(fontSize: 11, color: selected ? AppTheme.white.withValues(alpha: 0.7) : AppTheme.inkMuted)),
                  Text('${dt.day}', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: selected ? AppTheme.white : AppTheme.ink)),
                ]),
              ),
            );
          }).toList()),
        ),
      ),
      Expanded(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.blue))
            : _schedule.isEmpty
                ? const Center(child: Text('Sin citas para este día', style: TextStyle(color: AppTheme.inkMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _schedule.length,
                    itemBuilder: (_, i) => _scheduleTile(_schedule[i]),
                  ),
      ),
    ]);
  }

  Widget _scheduleTile(ScheduleBookingSlot s) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: AppTheme.cardDecoration(),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(color: AppTheme.ochreDim, borderRadius: BorderRadius.circular(8)),
            child: Column(children: [
              Text(s.startTime.substring(0, 5), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ochre)),
              Text(s.endTime.substring(0, 5), style: const TextStyle(fontSize: 10, color: AppTheme.ochre)),
            ]),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.clientName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.ink)),
            Text(s.serviceName, style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: AppTheme.statusBg(s.status), borderRadius: BorderRadius.circular(20)),
            child: Text(AppTheme.statusLabel(s.status),
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.statusColor(s.status))),
          ),
        ]),
      );

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
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.blue, width: 1.5)),
      );
}

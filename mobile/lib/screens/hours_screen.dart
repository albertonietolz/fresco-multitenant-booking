import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

const _days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const _dayEs = {
  'MONDAY': 'Lunes', 'TUESDAY': 'Martes', 'WEDNESDAY': 'Miércoles',
  'THURSDAY': 'Jueves', 'FRIDAY': 'Viernes', 'SATURDAY': 'Sábado', 'SUNDAY': 'Domingo',
};

class HoursScreen extends StatefulWidget {
  const HoursScreen({super.key});
  @override
  State<HoursScreen> createState() => _HoursScreenState();
}

class _HoursScreenState extends State<HoursScreen> {
  List<Employee> _employees = [];
  Employee? _selected;
  // tenantShifts: referencia de días/franjas del negocio
  Map<String, List<Map<String, String>>> _tenantShifts = {};
  // byDay: franjas del empleado seleccionado
  Map<String, List<Map<String, String>>> _byDay = {
    for (final d in _days) d: [],
  };
  bool _loading = true;
  String? _msg;
  bool _isError = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.get('/api/tenant/hours'),
        ApiService.get('/api/employees'),
      ]);

      // Horario del negocio como referencia
      final tenantHours = results[0] as List;
      final tShifts = <String, List<Map<String, String>>>{};
      for (final h in tenantHours) {
        final day = h['dayOfWeek'] as String;
        tShifts.putIfAbsent(day, () => []).add({
          's': (h['startTime'] as String).substring(0, 5),
          'e': (h['endTime'] as String).substring(0, 5),
        });
      }

      final employees = (results[1] as List)
          .map((e) => Employee.fromJson(e))
          .where((e) => e.active)
          .toList();

      setState(() {
        _tenantShifts = tShifts;
        _employees = employees;
        _selected = employees.isNotEmpty ? employees.first : null;
        _loading = false;
      });

      if (_selected != null) await _loadEmployeeHours(_selected!.id!);
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadEmployeeHours(int empId) async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/api/employees/$empId/working-hours');
      final map = <String, List<Map<String, String>>>{for (final d in _days) d: []};
      for (final h in data as List) {
        final day = h['dayOfWeek'] as String;
        final st = h['startTime'];
        final et = h['endTime'];
        map.putIfAbsent(day, () => []).add({
          'startTime': (st is List ? '${st[0].toString().padLeft(2,'0')}:${st[1].toString().padLeft(2,'0')}' : st.toString().substring(0, 5)),
          'endTime':   (et is List ? '${et[0].toString().padLeft(2,'0')}:${et[1].toString().padLeft(2,'0')}' : et.toString().substring(0, 5)),
        });
      }
      setState(() { _byDay = map; _loading = false; });
    } catch (_) {
      setState(() { _byDay = {for (final d in _days) d: []}; _loading = false; });
    }
  }

  Future<void> _save() async {
    if (_selected == null) return;
    try {
      final payload = <Map<String, dynamic>>[];
      for (final day in _days) {
        for (final b in _byDay[day] ?? []) {
          final s = b['startTime'] ?? '';
          final e = b['endTime'] ?? '';
          if (s.isNotEmpty && e.isNotEmpty) {
            payload.add({'dayOfWeek': day, 'startTime': '$s:00', 'endTime': '$e:00'});
          }
        }
      }
      await ApiService.put('/api/employees/${_selected!.id}/working-hours', {'shifts': payload});
      setState(() { _msg = 'Horarios guardados.'; _isError = false; });
    } catch (_) {
      setState(() { _msg = 'Error al guardar.'; _isError = true; });
    }
  }

  // Solo días en que el negocio tiene horario
  List<String> get _openDays => _days.where((d) => (_tenantShifts[d] ?? []).isNotEmpty).toList();

  void _addBlock(String day, {Map<String, String>? preset}) {
    setState(() {
      _byDay[day] = [...(_byDay[day] ?? []), preset ?? {'startTime': '', 'endTime': ''}];
    });
  }

  void _removeBlock(String day, int idx) {
    setState(() {
      final list = List<Map<String, String>>.from(_byDay[day] ?? []);
      list.removeAt(idx);
      _byDay[day] = list;
    });
  }

  void _updateBlock(String day, int idx, String key, String val) {
    setState(() {
      final list = List<Map<String, String>>.from(_byDay[day] ?? []);
      list[idx] = {...list[idx], key: val};
      _byDay[day] = list;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: _appBar(),
        backgroundColor: AppTheme.stone,
        body: const Center(child: CircularProgressIndicator(color: AppTheme.blue)),
      );
    }
    if (_employees.isEmpty) {
      return Scaffold(
        appBar: _appBar(),
        backgroundColor: AppTheme.stone,
        body: const Center(child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('No hay empleados activos. Crea uno primero desde la sección de Empleados.',
              textAlign: TextAlign.center, style: TextStyle(color: AppTheme.inkMuted)),
        )),
      );
    }

    return Scaffold(
      appBar: _appBar(),
      backgroundColor: AppTheme.stone,
      body: Column(children: [
        // Selector de empleado
        Container(
          color: AppTheme.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _employees.map((e) {
                final sel = _selected?.id == e.id;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () async {
                      setState(() { _selected = e; _msg = null; });
                      await _loadEmployeeHours(e.id!);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: sel ? AppTheme.blue : AppTheme.stone,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: sel ? AppTheme.blue : AppTheme.stoneBorder),
                      ),
                      child: Text(e.name, style: TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w500,
                        color: sel ? AppTheme.white : AppTheme.ink,
                      )),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        if (_openDays.isEmpty)
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppTheme.errorDim, borderRadius: BorderRadius.circular(8)),
            child: const Text(
              'El negocio no tiene horario configurado. Configúralo primero en Datos del negocio.',
              style: TextStyle(color: AppTheme.errorColor, fontSize: 13),
            ),
          ),

        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            children: [
              if (_msg != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _isError ? AppTheme.errorDim : const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_msg!, style: TextStyle(
                    color: _isError ? AppTheme.errorColor : AppTheme.success, fontSize: 13,
                  )),
                ),
              ..._openDays.map((day) => _dayCard(day)),
            ],
          ),
        ),
      ]),
      floatingActionButton: _openDays.isEmpty ? null : FloatingActionButton.extended(
        onPressed: _save,
        backgroundColor: AppTheme.blue,
        foregroundColor: AppTheme.white,
        icon: const Icon(Icons.save_outlined),
        label: const Text('Guardar', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }

  AppBar _appBar() => AppBar(
    title: const Text('Horarios por empleado'),
    backgroundColor: AppTheme.blue,
    foregroundColor: AppTheme.white,
  );

  Widget _dayCard(String day) {
    final blocks = _byDay[day] ?? [];
    final tenantBlocks = _tenantShifts[day] ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AppTheme.cardDecoration(),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header del día
        Container(
          padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppTheme.ochreDim, borderRadius: BorderRadius.circular(6)),
              child: Text(_dayEs[day]!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.ochre)),
            ),
            const Spacer(),
            // Atajos
            if (tenantBlocks.isNotEmpty) ...[
              _quickBtn('+ 1ª', () => _addBlock(day, preset: {'startTime': tenantBlocks[0]['s']!, 'endTime': tenantBlocks[0]['e']!}), AppTheme.blue),
              if (tenantBlocks.length >= 2) ...[
                const SizedBox(width: 4),
                _quickBtn('+ 2ª', () => _addBlock(day, preset: {'startTime': tenantBlocks[1]['s']!, 'endTime': tenantBlocks[1]['e']!}), AppTheme.blue),
              ],
            ],
            const SizedBox(width: 4),
            _quickBtn('+ Manual', () => _addBlock(day), AppTheme.inkMuted),
          ]),
        ),
        if (blocks.isEmpty)
          const Padding(
            padding: EdgeInsets.fromLTRB(14, 0, 14, 12),
            child: Text('Sin turno', style: TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
          )
        else
          ...blocks.asMap().entries.map((entry) {
            final idx = entry.key;
            final block = entry.value;
            return Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
              child: Row(children: [
                Expanded(child: _timeInput(block['startTime'] ?? '', (v) => _updateBlock(day, idx, 'startTime', v))),
                const Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Text('–', style: TextStyle(color: AppTheme.inkMuted))),
                Expanded(child: _timeInput(block['endTime'] ?? '', (v) => _updateBlock(day, idx, 'endTime', v))),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _removeBlock(day, idx),
                  child: const Icon(Icons.close, size: 18, color: AppTheme.inkMuted),
                ),
              ]),
            );
          }),
      ]),
    );
  }

  Widget _quickBtn(String label, VoidCallback onTap, Color color) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: color.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w500)),
    ),
  );

  Widget _timeInput(String value, ValueChanged<String> onChanged) {
    return GestureDetector(
      onTap: () async {
        final parts = value.split(':');
        final hour = parts.isNotEmpty ? int.tryParse(parts[0]) ?? 9 : 9;
        final minute = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
        final picked = await showTimePicker(
          context: context,
          initialTime: TimeOfDay(hour: hour, minute: minute),
          builder: (ctx, child) => MediaQuery(
            data: MediaQuery.of(ctx).copyWith(alwaysUse24HourFormat: true),
            child: child!,
          ),
        );
        if (picked != null) {
          onChanged('${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}');
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.stone,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: value.isEmpty ? AppTheme.stoneBorder : AppTheme.blue),
        ),
        child: Row(children: [
          Icon(Icons.access_time, size: 16, color: value.isEmpty ? AppTheme.inkMuted : AppTheme.blue),
          const SizedBox(width: 6),
          Text(
            value.isEmpty ? '—:—' : value,
            style: TextStyle(
              fontSize: 14, fontWeight: FontWeight.w500,
              color: value.isEmpty ? AppTheme.inkMuted : AppTheme.ink,
            ),
          ),
        ]),
      ),
    );
  }
}

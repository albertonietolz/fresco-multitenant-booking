import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class EmployeesTab extends StatefulWidget {
  const EmployeesTab({super.key});

  @override
  State<EmployeesTab> createState() => _EmployeesTabState();
}

class _EmployeesTabState extends State<EmployeesTab> {
  List<Employee> _employees = [];
  List<Service> _services = [];
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
        ApiService.get('/api/employees'),
        ApiService.get('/api/services'),
      ]);
      setState(() {
        _employees = (results[0] as List).map((e) => Employee.fromJson(e)).toList();
        _services = (results[1] as List).map((e) => Service.fromJson(e)).where((s) => s.active).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _openModal({Employee? emp}) {
    final nameCtrl = TextEditingController(text: emp?.name ?? '');
    final emailCtrl = TextEditingController(text: emp?.email ?? '');
    final phoneCtrl = TextEditingController(text: emp?.phone ?? '');
    final pinCtrl = TextEditingController(text: emp?.pin ?? '');
    final selectedIds = List<int>.from(emp?.serviceIds ?? []);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(emp == null ? 'Nuevo empleado' : 'Editar empleado',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.ink)),
              const SizedBox(height: 20),
              _field('Nombre completo', nameCtrl),
              const SizedBox(height: 12),
              _field('Email', emailCtrl, type: TextInputType.emailAddress),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _field('Teléfono', phoneCtrl, type: TextInputType.phone)),
                const SizedBox(width: 12),
                Expanded(child: _field('PIN (4-6 dígitos)', pinCtrl, type: TextInputType.number)),
              ]),
              if (_services.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Servicios asignados',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.inkMuted)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: _services.map((s) {
                    final selected = selectedIds.contains(s.id);
                    return GestureDetector(
                      onTap: () => setModal(() {
                        if (selected) { selectedIds.remove(s.id); }
                        else { selectedIds.add(s.id); }
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: selected ? AppTheme.blue : AppTheme.stone,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: selected ? AppTheme.blue : AppTheme.stoneBorder),
                        ),
                        child: Text(s.name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: selected ? AppTheme.white : AppTheme.ink,
                            )),
                      ),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  try {
                    final body = {
                      'name': nameCtrl.text.trim(),
                      'email': emailCtrl.text.trim().isEmpty ? null : emailCtrl.text.trim(),
                      'phone': phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                      'pin': pinCtrl.text.trim().isEmpty ? null : pinCtrl.text.trim(),
                      'active': true,
                      'serviceIds': selectedIds,
                    };
                    if (emp == null) {
                      await ApiService.post('/api/employees', body);
                    } else {
                      await ApiService.put('/api/employees/${emp.id}', body);
                    }
                    if (ctx.mounted) Navigator.of(ctx).pop();
                    _load();
                  } catch (_) {}
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.blue,
                  foregroundColor: AppTheme.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: Text(emp == null ? 'Crear empleado' : 'Guardar cambios',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
            ]),
          ),
        ),
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
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openModal(),
        backgroundColor: AppTheme.blue,
        foregroundColor: AppTheme.white,
        child: const Icon(Icons.person_add_outlined),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.blue))
          : RefreshIndicator(
              color: AppTheme.blue,
              onRefresh: _load,
              child: _employees.isEmpty
                  ? const Center(child: Text('Sin empleados', style: TextStyle(color: AppTheme.inkMuted)))
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                      itemCount: _employees.length,
                      itemBuilder: (_, i) => _tile(_employees[i]),
                    ),
            ),
    );
  }

  Widget _tile(Employee e) {
    final empServices = _services.where((s) => e.serviceIds.contains(s.id)).toList();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: AppTheme.blue.withValues(alpha: 0.12),
          child: Text(_initials(e.name), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.blue)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(e.name, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: e.active ? AppTheme.ink : AppTheme.inkMuted)),
          if (e.email != null) ...[
            const SizedBox(height: 2),
            Text(e.email!, style: const TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
          ],
          const SizedBox(height: 6),
          Row(children: [
            _chip(e.hasPinSet ? 'PIN configurado' : 'Sin PIN', e.hasPinSet ? AppTheme.success : AppTheme.errorColor),
            const SizedBox(width: 6),
            _chip(e.active ? 'Activo' : 'Inactivo', e.active ? AppTheme.inkMuted : AppTheme.errorColor),
          ]),
          if (empServices.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: empServices.map((s) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.ochreDim,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(s.name, style: const TextStyle(fontSize: 10, color: AppTheme.ochre, fontWeight: FontWeight.w600)),
              )).toList(),
            ),
          ],
        ])),
        IconButton(
          icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.inkMuted),
          onPressed: () => _openModal(emp: e),
        ),
      ]),
    );
  }

  Widget _chip(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
        child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
      );

  Widget _field(String label, TextEditingController ctrl, {TextInputType? type}) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.inkMuted)),
          const SizedBox(height: 4),
          TextField(
            controller: ctrl,
            keyboardType: type,
            decoration: InputDecoration(
              filled: true,
              fillColor: AppTheme.stone,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.blue, width: 1.5)),
            ),
          ),
        ],
      );
}

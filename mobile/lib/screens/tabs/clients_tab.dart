import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app_theme.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class ClientsTab extends StatefulWidget {
  const ClientsTab({super.key});

  @override
  State<ClientsTab> createState() => _ClientsTabState();
}

class _ClientsTabState extends State<ClientsTab> {
  List<Client> _clients = [];
  List<Employee> _employees = [];
  List<Service> _services = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService.get('/api/clients'),
        ApiService.get('/api/employees'),
        ApiService.get('/api/services'),
      ]);
      setState(() {
        _clients = (results[0] as List).map((j) => Client.fromJson(j)).toList();
        _employees = (results[1] as List).map((j) => Employee.fromJson(j)).toList();
        _services = (results[2] as List).map((j) => Service.fromJson(j)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  String? _empName(int? id) {
    if (id == null) return null;
    try { return _employees.firstWhere((e) => e.id == id).name; } catch (_) { return null; }
  }

  String? _svcName(int? id) {
    if (id == null) return null;
    try { return _services.firstWhere((s) => s.id == id).name; } catch (_) { return null; }
  }

  List<Client> get _filtered {
    final q = _search.toLowerCase();
    if (q.isEmpty) return _clients;
    return _clients.where((c) =>
        (c.name.toLowerCase().contains(q)) ||
        (c.email?.toLowerCase().contains(q) ?? false)).toList();
  }

  void _openForm({Client? client}) {
    final nameCtrl = TextEditingController(text: client?.name ?? '');
    final emailCtrl = TextEditingController(text: client?.email ?? '');
    final phoneCtrl = TextEditingController(text: client?.phone ?? '');
    final notesCtrl = TextEditingController(text: client?.notes ?? '');
    int? prefEmpId = client?.preferredEmployeeId;
    int? prefSvcId = client?.preferredServiceId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(builder: (ctx2, setSt) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx2).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  client == null ? 'Nuevo cliente' : 'Editar cliente',
                  style: AppTheme.serif(size: 22, color: AppTheme.ink),
                ),
                const SizedBox(height: 16),
                TextField(controller: nameCtrl, decoration: AppTheme.inputDec('Nombre *')),
                const SizedBox(height: 10),
                TextField(controller: emailCtrl, decoration: AppTheme.inputDec('Email'), keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 10),
                TextField(controller: phoneCtrl, decoration: AppTheme.inputDec('Teléfono'), keyboardType: TextInputType.phone),
                const SizedBox(height: 10),
                TextField(controller: notesCtrl, decoration: AppTheme.inputDec('Notas'), maxLines: 3),
                const SizedBox(height: 10),
                Text('Empleado preferido', style: AppTheme.sans(size: 12, color: AppTheme.inkMuted)),
                const SizedBox(height: 4),
                DropdownButtonFormField<int?>(
                  initialValue: prefEmpId,
                  decoration: AppTheme.inputDec(''),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('— Ninguno —')),
                    ..._employees.where((e) => e.active).map((e) => DropdownMenuItem(value: e.id, child: Text(e.name))),
                  ],
                  onChanged: (v) => setSt(() => prefEmpId = v),
                ),
                const SizedBox(height: 10),
                Text('Servicio preferido', style: AppTheme.sans(size: 12, color: AppTheme.inkMuted)),
                const SizedBox(height: 4),
                DropdownButtonFormField<int?>(
                  initialValue: prefSvcId,
                  decoration: AppTheme.inputDec(''),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('— Ninguno —')),
                    ..._services.where((s) => s.active).map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))),
                  ],
                  onChanged: (v) => setSt(() => prefSvcId = v),
                ),
                const SizedBox(height: 20),
                Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx2),
                      style: OutlinedButton.styleFrom(foregroundColor: AppTheme.inkMuted, side: const BorderSide(color: AppTheme.stoneBorder)),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        if (nameCtrl.text.trim().isEmpty) return;
                        final body = {
                          'name': nameCtrl.text.trim(),
                          'email': emailCtrl.text.trim().isEmpty ? null : emailCtrl.text.trim(),
                          'phone': phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                          'notes': notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
                          'preferredEmployeeId': prefEmpId,
                          'preferredServiceId': prefSvcId,
                        };
                        try {
                          if (client == null) {
                            final j = await ApiService.post('/api/clients', body);
                            setState(() => _clients.add(Client.fromJson(j)));
                          } else {
                            final j = await ApiService.put('/api/clients/${client.id}', body);
                            final updated = Client.fromJson(j);
                            setState(() {
                              final idx = _clients.indexWhere((c) => c.id == client.id);
                              if (idx >= 0) _clients[idx] = updated;
                            });
                          }
                          if (ctx2.mounted) Navigator.pop(ctx2);
                        } catch (_) {}
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue, foregroundColor: AppTheme.white),
                      child: const Text('Guardar'),
                    ),
                  ),
                ]),
              ],
            ),
          ),
        );
      }),
    );
  }

  Future<void> _delete(Client client) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar cliente'),
        content: Text('¿Eliminar a ${client.name}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Eliminar', style: TextStyle(color: AppTheme.errorColor))),
        ],
      ),
    );
    if (ok == true) {
      try {
        await ApiService.delete('/api/clients/${client.id}');
        setState(() => _clients.removeWhere((c) => c.id == client.id));
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.stone,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              decoration: AppTheme.inputDec('Buscar por nombre o email…'),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? Center(child: Text('No hay clientes.', style: AppTheme.sans(color: AppTheme.inkMuted)))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) {
                            final c = _filtered[i];
                            final empN = _empName(c.preferredEmployeeId);
                            final svcN = _svcName(c.preferredServiceId);
                            return Card(
                              margin: const EdgeInsets.only(bottom: 10),
                              color: AppTheme.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: const BorderSide(color: AppTheme.stoneBorder),
                              ),
                              elevation: 0,
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(c.name, style: GoogleFonts.cormorantGaramond(fontSize: 17, fontWeight: FontWeight.w600, color: AppTheme.ink)),
                                          if (c.email != null) ...[
                                            const SizedBox(height: 4),
                                            Text(c.email!, style: AppTheme.sans(size: 13, color: AppTheme.inkMuted)),
                                          ],
                                          if (c.phone != null) ...[
                                            const SizedBox(height: 2),
                                            Text(c.phone!, style: AppTheme.sans(size: 13, color: AppTheme.inkMuted)),
                                          ],
                                          if (empN != null || svcN != null) ...[
                                            const SizedBox(height: 6),
                                            Wrap(spacing: 6, children: [
                                              if (empN != null) _chip('👤 $empN'),
                                              if (svcN != null) _chip('✂ $svcN'),
                                            ]),
                                          ],
                                        ],
                                      ),
                                    ),
                                    Column(children: [
                                      IconButton(
                                        onPressed: () => _openForm(client: c),
                                        icon: const Icon(Icons.edit_outlined, size: 20),
                                        color: AppTheme.inkMuted,
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      IconButton(
                                        onPressed: () => _delete(c),
                                        icon: const Icon(Icons.delete_outline, size: 20),
                                        color: AppTheme.errorColor,
                                        visualDensity: VisualDensity.compact,
                                      ),
                                    ]),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(),
        backgroundColor: AppTheme.blue,
        child: const Icon(Icons.person_add_outlined, color: AppTheme.white),
      ),
    );
  }

  Widget _chip(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        decoration: BoxDecoration(
          color: AppTheme.ochreDim,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: AppTheme.sans(size: 11, color: AppTheme.ochre)),
      );
}

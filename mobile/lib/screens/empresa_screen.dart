import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../app_theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;

const _days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const _dayEs = {
  'MONDAY': 'Lunes', 'TUESDAY': 'Martes', 'WEDNESDAY': 'Miércoles',
  'THURSDAY': 'Jueves', 'FRIDAY': 'Viernes', 'SATURDAY': 'Sábado', 'SUNDAY': 'Domingo',
};

class EmpresaScreen extends StatefulWidget {
  const EmpresaScreen({super.key});
  @override
  State<EmpresaScreen> createState() => _EmpresaScreenState();
}

class _EmpresaScreenState extends State<EmpresaScreen> {
  Tenant? _tenant;
  List<TenantDocument> _docs = [];
  // Horario del negocio: Map<day, List<{startTime, endTime}>>
  Map<String, List<Map<String, String>>> _bhByDay = {
    for (final d in _days) d: [],
  };
  bool _loading = true;
  bool _saving = false;
  bool _savingHours = false;
  String? _infoMsg;
  String? _hoursMsg;
  bool _hoursError = false;

  final _nameCtrl    = TextEditingController();
  final _emailCtrl   = TextEditingController();
  final _phoneCtrl   = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _allowEmployeeChoice = false;

  @override
  void initState() { super.initState(); _load(); }

  @override
  void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose();
    _phoneCtrl.dispose(); _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.get('/api/tenant'),
        ApiService.get('/api/tenant/documents'),
        ApiService.get('/api/tenant/hours'),
      ]);
      final t = Tenant.fromJson(results[0]);
      final bh = results[2] as List;
      final map = <String, List<Map<String, String>>>{for (final d in _days) d: []};
      for (final h in bh) {
        final day = h['dayOfWeek'] as String;
        final st = h['startTime'] as String;
        final et = h['endTime'] as String;
        map.putIfAbsent(day, () => []).add({
          'startTime': st.substring(0, 5),
          'endTime':   et.substring(0, 5),
        });
      }
      setState(() {
        _tenant = t;
        _docs = (results[1] as List).map((e) => TenantDocument.fromJson(e)).toList();
        _nameCtrl.text = t.name;
        _emailCtrl.text = t.email ?? '';
        _phoneCtrl.text = t.phone ?? '';
        _addressCtrl.text = t.address ?? '';
        _allowEmployeeChoice = t.allowEmployeeChoice;
        _bhByDay = map;
        _loading = false;
      });
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _saveInfo() async {
    setState(() { _saving = true; _infoMsg = null; });
    try {
      await ApiService.put('/api/tenant', {
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'allowEmployeeChoice': _allowEmployeeChoice,
      });
      setState(() => _infoMsg = '✓ Cambios guardados');
    } catch (_) { setState(() => _infoMsg = 'Error al guardar'); }
    finally { setState(() => _saving = false); }
  }

  Future<void> _saveHours() async {
    setState(() { _savingHours = true; _hoursMsg = null; });
    try {
      final payload = <Map<String, dynamic>>[];
      for (final day in _days) {
        for (final b in _bhByDay[day] ?? []) {
          final s = b['startTime'] ?? '';
          final e = b['endTime'] ?? '';
          if (s.isNotEmpty && e.isNotEmpty) {
            payload.add({'dayOfWeek': day, 'startTime': '$s:00', 'endTime': '$e:00'});
          }
        }
      }
      await ApiService.put('/api/tenant/hours', {'shifts': payload});
      setState(() { _hoursMsg = 'Horario guardado.'; _hoursError = false; });
    } catch (_) { setState(() { _hoursMsg = 'Error al guardar.'; _hoursError = true; }); }
    finally { setState(() => _savingHours = false); }
  }

  Future<void> _deleteDoc(TenantDocument doc) async {
    try { await ApiService.delete('/api/tenant/documents/${doc.id}'); await _load(); } catch (_) {}
  }

  String _portalBase() {
    if (kIsWeb) {
      final base = Uri.base;
      final port = base.port;
      final portStr = (port == 80 || port == 443) ? '' : ':$port';
      return '${base.scheme}://${base.host}$portStr';
    }
    return ApiService.baseUrl;
  }

  void _copyLink(String url) {
    Clipboard.setData(ClipboardData(text: url));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Enlace copiado'), duration: Duration(seconds: 2)),
    );
  }

  void _openLink(String url) {
    if (kIsWeb) {
      html.window.open(url, '_blank');
    }
  }

  void _addBlock(String day) {
    setState(() {
      _bhByDay[day] = [...(_bhByDay[day] ?? []), {'startTime': '', 'endTime': ''}];
    });
  }

  void _removeBlock(String day, int idx) {
    setState(() {
      final list = List<Map<String, String>>.from(_bhByDay[day] ?? []);
      list.removeAt(idx);
      _bhByDay[day] = list;
    });
  }

  void _updateBlock(String day, int idx, String key, String val) {
    setState(() {
      final list = List<Map<String, String>>.from(_bhByDay[day] ?? []);
      list[idx] = {...list[idx], key: val};
      _bhByDay[day] = list;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Datos del negocio'),
        backgroundColor: AppTheme.blue,
        foregroundColor: AppTheme.white,
      ),
      backgroundColor: AppTheme.stone,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.blue))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_tenant != null) ...[
                  _portalLinksCard(_tenant!),
                  const SizedBox(height: 16),
                ],
                _card('Información general', [
                  _field('Nombre del negocio', _nameCtrl),
                  const SizedBox(height: 12),
                  _field('Email de contacto', _emailCtrl, type: TextInputType.emailAddress),
                  const SizedBox(height: 12),
                  _field('Teléfono', _phoneCtrl, type: TextInputType.phone),
                  const SizedBox(height: 12),
                  _field('Dirección', _addressCtrl),
                  const SizedBox(height: 12),
                  _toggleRow('Permitir elección de empleado', _allowEmployeeChoice,
                      (v) => setState(() => _allowEmployeeChoice = v)),
                  const SizedBox(height: 16),
                  if (_infoMsg != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_infoMsg!,
                          style: TextStyle(color: _infoMsg!.startsWith('✓') ? AppTheme.success : AppTheme.errorColor, fontSize: 13)),
                    ),
                  _saveBtn('Guardar cambios', _saving, _saveInfo),
                ]),
                const SizedBox(height: 16),
                _card('Horario del negocio', [
                  const Text(
                    'Define el horario general de apertura. Puedes añadir jornadas partidas con varios bloques por día.',
                    style: TextStyle(fontSize: 12, color: AppTheme.inkMuted, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  ..._days.map((day) => _bhDayRow(day)),
                  const SizedBox(height: 16),
                  if (_hoursMsg != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_hoursMsg!,
                          style: TextStyle(color: _hoursError ? AppTheme.errorColor : AppTheme.success, fontSize: 13)),
                    ),
                  _saveBtn('Guardar horario', _savingHours, _saveHours),
                ]),
                const SizedBox(height: 16),
                _card('Documentos del negocio', [
                  if (_docs.isEmpty)
                    const Text('No hay documentos subidos.', style: TextStyle(color: AppTheme.inkMuted, fontSize: 13))
                  else
                    ..._docs.map((d) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.picture_as_pdf, color: AppTheme.ochre),
                          title: Text(d.displayName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                          subtitle: Text(d.fileName, style: const TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline, color: AppTheme.errorColor, size: 20),
                            onPressed: () => _deleteDoc(d),
                          ),
                        )),
                  const SizedBox(height: 8),
                  const Text('Sube PDFs desde el Dashboard web.', style: TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
                ]),
              ],
            ),
    );
  }

  Widget _bhDayRow(String day) {
    final blocks = _bhByDay[day] ?? [];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          SizedBox(
            width: 90,
            child: Text(_dayEs[day]!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.ink)),
          ),
          if (blocks.isEmpty)
            const Text('Cerrado', style: TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
          const Spacer(),
          GestureDetector(
            onTap: () => _addBlock(day),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.stoneBorder),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('+ Franja', style: TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
            ),
          ),
        ]),
        ...blocks.asMap().entries.map((e) => Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Row(children: [
            const SizedBox(width: 90),
            Expanded(child: _timeInput(e.value['startTime'] ?? '', (v) => _updateBlock(day, e.key, 'startTime', v))),
            const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('–', style: TextStyle(color: AppTheme.inkMuted))),
            Expanded(child: _timeInput(e.value['endTime'] ?? '', (v) => _updateBlock(day, e.key, 'endTime', v))),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _removeBlock(day, e.key),
              child: const Icon(Icons.close, size: 16, color: AppTheme.inkMuted),
            ),
          ]),
        )),
      ]),
    );
  }

  Widget _portalLinksCard(Tenant t) {
    final base = _portalBase();
    final bookingUrl  = '$base/${t.slug}/booking';
    final employeeUrl = '$base/${t.slug}/employee';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(bg: AppTheme.blue),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.link, color: AppTheme.white, size: 16),
          const SizedBox(width: 8),
          Text('Slug: ${t.slug}', style: const TextStyle(color: AppTheme.white, fontSize: 13, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 14),
        _linkRow('Reservas de clientes', bookingUrl, Icons.calendar_today_outlined),
        const SizedBox(height: 8),
        _linkRow('Portal de empleados', employeeUrl, Icons.badge_outlined),
      ]),
    );
  }

  Widget _linkRow(String label, String url, IconData icon) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppTheme.white.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
        child: Row(children: [
          Icon(icon, color: AppTheme.white, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(color: AppTheme.white, fontSize: 12, fontWeight: FontWeight.w600)),
            Text(url, style: TextStyle(color: AppTheme.white.withValues(alpha: 0.7), fontSize: 10),
                maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
          IconButton(
            icon: Icon(Icons.copy, color: AppTheme.white.withValues(alpha: 0.8), size: 18),
            onPressed: () => _copyLink(url),
            padding: EdgeInsets.zero, constraints: const BoxConstraints(),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: Icon(Icons.open_in_new, color: AppTheme.white.withValues(alpha: 0.8), size: 18),
            onPressed: () => _openLink(url),
            padding: EdgeInsets.zero, constraints: const BoxConstraints(),
          ),
        ]),
      );

  Widget _toggleRow(String label, bool value, ValueChanged<bool> onChanged) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.ink, fontWeight: FontWeight.w500)),
          Switch(value: value, onChanged: onChanged,
              activeThumbColor: AppTheme.blue, activeTrackColor: AppTheme.blue.withValues(alpha: 0.4)),
        ],
      );

  Widget _saveBtn(String label, bool loading, VoidCallback onTap) => SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: loading ? null : onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.blue, foregroundColor: AppTheme.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0,
          ),
          child: loading
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: AppTheme.white, strokeWidth: 2))
              : Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
      );

  Widget _card(String title, List<Widget> children) => Container(
        margin: const EdgeInsets.only(bottom: 4),
        padding: const EdgeInsets.all(16),
        decoration: AppTheme.cardDecoration(),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.ink)),
          const SizedBox(height: 16),
          ...children,
        ]),
      );

  Widget _field(String label, TextEditingController ctrl, {TextInputType? type}) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.inkMuted)),
          const SizedBox(height: 4),
          TextField(
            controller: ctrl, keyboardType: type,
            decoration: InputDecoration(
              filled: true, fillColor: AppTheme.stone,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.blue, width: 1.5)),
            ),
          ),
        ],
      );

  Widget _timeInput(String value, ValueChanged<String> onChanged) => TextField(
        controller: TextEditingController(text: value),
        onChanged: onChanged,
        style: const TextStyle(fontSize: 13, color: AppTheme.ink),
        decoration: InputDecoration(
          hintText: '09:00',
          hintStyle: const TextStyle(color: AppTheme.inkMuted, fontSize: 12),
          filled: true, fillColor: AppTheme.stone,
          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.stoneBorder)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.blue, width: 1.5)),
        ),
      );
}

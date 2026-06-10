import 'dart:async';
import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

class ServicesTab extends StatefulWidget {
  const ServicesTab({super.key});

  @override
  State<ServicesTab> createState() => _ServicesTabState();
}

class _ServicesTabState extends State<ServicesTab> {
  List<Service> _services = [];
  List<Employee> _employees = [];
  bool _loading = true;
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
        ApiService.get('/api/services'),
        ApiService.get('/api/employees'),
      ]);
      setState(() {
        _services = (results[0] as List).map((e) => Service.fromJson(e)).toList();
        _employees = (results[1] as List).map((e) => Employee.fromJson(e)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _openModal({Service? svc}) {
    final nameCtrl = TextEditingController(text: svc?.name ?? '');
    final durCtrl = TextEditingController(text: svc?.duration.toString() ?? '');
    final capCtrl = TextEditingController(text: (svc?.capacity != null && svc!.capacity! > 0) ? svc.capacity.toString() : '');
    final chairCtrl = TextEditingController(text: svc?.chairTime?.toString() ?? '');
    final priceCtrl = TextEditingController(text: svc?.price?.toStringAsFixed(2) ?? '');
    final schedDatesCtrl = TextEditingController(text: svc?.specificDates ?? '');

    String serviceMode = svc?.capacity != null ? 'capacity' : (svc?.chairTime != null ? 'split' : 'sequential');
    bool sinLimite = svc?.capacity == 0;
    bool hasPrice = svc?.price != null;
    bool allowPartySize = svc?.allowPartySize ?? false;
    int? selectedEmployeeId = svc?.defaultEmployeeId;
    String schedMode = svc?.schedulingMode ?? 'ANY';
    Set<String> schedWeekdays = svc?.allowedWeekdays != null
        ? svc!.allowedWeekdays!.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toSet()
        : {};

    const dayIds = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) {
          Future<void> save() async {
            try {
              final body = {
                'name': nameCtrl.text.trim(),
                'duration': int.tryParse(durCtrl.text) ?? 30,
                'capacity': serviceMode == 'capacity'
                    ? (sinLimite ? 0 : (capCtrl.text.isEmpty ? null : int.tryParse(capCtrl.text)))
                    : null,
                'chairTime': serviceMode == 'split' && chairCtrl.text.isNotEmpty
                    ? int.tryParse(chairCtrl.text) : null,
                'price': hasPrice && priceCtrl.text.isNotEmpty
                    ? double.tryParse(priceCtrl.text.replaceAll(',', '.')) : null,
                'defaultEmployeeId': selectedEmployeeId,
                'allowPartySize': serviceMode == 'capacity' && !sinLimite ? allowPartySize : false,
                'schedulingMode': schedMode,
                'allowedWeekdays': schedMode == 'WEEKDAYS' ? schedWeekdays.join(',') : null,
                'specificDates': schedMode == 'SPECIFIC' ? schedDatesCtrl.text.trim() : null,
              };
              if (svc == null) {
                await ApiService.post('/api/services', body);
              } else {
                await ApiService.put('/api/services/${svc.id}', body);
              }
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
            } catch (_) {}
          }

          return Padding(
            padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Title
                  Row(children: [
                    Expanded(child: Text(
                      svc == null ? 'Nuevo servicio' : 'Editar servicio',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.ink),
                    )),
                    IconButton(icon: const Icon(Icons.close, color: AppTheme.inkMuted), onPressed: () => Navigator.pop(ctx)),
                  ]),
                  const SizedBox(height: 16),

                  // Name + Duration
                  _field('Nombre del servicio', nameCtrl),
                  const SizedBox(height: 12),
                  _field('Duración total (min)', durCtrl, type: TextInputType.number),
                  const SizedBox(height: 16),

                  // Service mode
                  _sectionLabel('Tipo de servicio'),
                  const SizedBox(height: 8),
                  ...([
                    ('sequential', 'Cita individual', 'Un cliente por turno'),
                    ('capacity', 'Con aforo', 'Varios clientes al mismo tiempo'),
                    ('split', 'Tiempo pasivo', 'El profesional no necesita estar todo el tiempo'),
                  ].map((opt) => GestureDetector(
                    onTap: () => setModal(() => serviceMode = opt.$1),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: serviceMode == opt.$1 ? AppTheme.blue.withValues(alpha: 0.08) : AppTheme.stone,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: serviceMode == opt.$1 ? AppTheme.blue : AppTheme.stoneBorder,
                          width: serviceMode == opt.$1 ? 1.5 : 1,
                        ),
                      ),
                      child: Row(children: [
                        Icon(
                          serviceMode == opt.$1 ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: serviceMode == opt.$1 ? AppTheme.blue : AppTheme.stoneBorder,
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(opt.$2, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                              color: serviceMode == opt.$1 ? AppTheme.blue : AppTheme.ink)),
                          Text(opt.$3, style: const TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
                        ])),
                      ]),
                    ),
                  ))),

                  // Capacity options
                  if (serviceMode == 'capacity') ...[
                    const SizedBox(height: 10),
                    Row(children: [
                      Checkbox(
                        value: sinLimite,
                        onChanged: (v) => setModal(() => sinLimite = v ?? false),
                        activeColor: AppTheme.blue,
                      ),
                      const Text('Sin límite de plazas', style: TextStyle(fontSize: 13, color: AppTheme.ink)),
                    ]),
                    if (!sinLimite) ...[
                      _field('Nº máximo de plazas', capCtrl, type: TextInputType.number),
                      const SizedBox(height: 8),
                      Row(children: [
                        Switch(
                          value: allowPartySize,
                          onChanged: (v) => setModal(() => allowPartySize = v),
                          activeThumbColor: AppTheme.blue,
                          activeTrackColor: AppTheme.blue.withValues(alpha: 0.4),
                        ),
                        const Expanded(child: Text('Contar plazas por grupo de personas',
                            style: TextStyle(fontSize: 13, color: AppTheme.ink))),
                      ]),
                    ],
                  ],

                  // Chair time option
                  if (serviceMode == 'split') ...[
                    const SizedBox(height: 10),
                    _field('Tiempo activo del profesional (min)', chairCtrl, type: TextInputType.number),
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text('Minutos que el profesional debe estar presente. El resto es espera.',
                          style: TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Price
                  Row(children: [
                    Checkbox(
                      value: hasPrice,
                      onChanged: (v) => setModal(() { hasPrice = v ?? false; if (!hasPrice) priceCtrl.clear(); }),
                      activeColor: AppTheme.blue,
                    ),
                    const Text('Añadir precio', style: TextStyle(fontSize: 13, color: AppTheme.ink)),
                  ]),
                  if (hasPrice) ...[
                    _field('Precio (€)', priceCtrl, type: const TextInputType.numberWithOptions(decimal: true)),
                    const SizedBox(height: 8),
                  ],

                  // Default employee
                  if (_employees.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    _sectionLabel('Empleado por defecto'),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.stone,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.stoneBorder),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int?>(
                          value: selectedEmployeeId,
                          isExpanded: true,
                          style: const TextStyle(fontSize: 14, color: AppTheme.ink),
                          items: [
                            const DropdownMenuItem<int?>(value: null, child: Text('Sin asignar')),
                            ..._employees.map((e) => DropdownMenuItem<int?>(value: e.id, child: Text(e.name))),
                          ],
                          onChanged: (v) => setModal(() => selectedEmployeeId = v),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Scheduling constraints
                  _sectionLabel('Disponibilidad'),
                  const SizedBox(height: 8),
                  ...([
                    ('ANY', 'Cualquier día', 'Sin restricción'),
                    ('WEEKDAYS', 'Días de la semana', 'Ej: solo lunes y miércoles'),
                    ('SPECIFIC', 'Fechas exactas', 'Fechas concretas del calendario'),
                  ].map((opt) => GestureDetector(
                    onTap: () => setModal(() => schedMode = opt.$1),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: schedMode == opt.$1 ? AppTheme.ochreDim : AppTheme.stone,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: schedMode == opt.$1 ? AppTheme.ochre : AppTheme.stoneBorder,
                        ),
                      ),
                      child: Row(children: [
                        Icon(
                          schedMode == opt.$1 ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: schedMode == opt.$1 ? AppTheme.ochre : AppTheme.stoneBorder,
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(opt.$2, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                              color: schedMode == opt.$1 ? AppTheme.ochre : AppTheme.ink)),
                          Text(opt.$3, style: const TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
                        ]),
                      ]),
                    ),
                  ))),

                  if (schedMode == 'WEEKDAYS') ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      children: List.generate(7, (i) {
                        final id = dayIds[i];
                        final label = dayLabels[i];
                        final selected = schedWeekdays.contains(id);
                        return GestureDetector(
                          onTap: () => setModal(() {
                            if (selected) schedWeekdays.remove(id);
                            else schedWeekdays.add(id);
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: selected ? AppTheme.blue : AppTheme.stone,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: selected ? AppTheme.blue : AppTheme.stoneBorder),
                            ),
                            child: Text(label, style: TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w600,
                              color: selected ? AppTheme.white : AppTheme.ink,
                            )),
                          ),
                        );
                      }),
                    ),
                  ],

                  if (schedMode == 'SPECIFIC') ...[
                    const SizedBox(height: 8),
                    _field('Fechas (AAAA-MM-DD, separadas por coma)', schedDatesCtrl),
                  ],

                  // Custom fields note
                  if (svc != null && svc.fields.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _sectionLabel('Campos personalizados'),
                    const SizedBox(height: 6),
                    ...svc.fields.map((f) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(children: [
                        const Icon(Icons.label_outline, size: 14, color: AppTheme.inkMuted),
                        const SizedBox(width: 6),
                        Text(f.label, style: const TextStyle(fontSize: 13, color: AppTheme.ink)),
                        if (f.required) ...[
                          const SizedBox(width: 4),
                          const Text('*', style: TextStyle(color: AppTheme.errorColor, fontSize: 12)),
                        ],
                        const Spacer(),
                        Text(f.fieldType, style: const TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
                      ]),
                    )),
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text('Gestiona los campos desde la versión web.',
                          style: TextStyle(fontSize: 11, color: AppTheme.inkMuted)),
                    ),
                  ],

                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.blue,
                      foregroundColor: AppTheme.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(
                      svc == null ? 'Crear servicio' : 'Guardar cambios',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.stone,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openModal(),
        backgroundColor: AppTheme.blue,
        foregroundColor: AppTheme.white,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.blue))
          : RefreshIndicator(
              color: AppTheme.blue,
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                itemCount: _services.length,
                itemBuilder: (_, i) => _tile(_services[i]),
              ),
            ),
    );
  }

  Widget _tile(Service s) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: AppTheme.cardDecoration(),
        child: Row(children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(color: AppTheme.ochreDim, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.medical_services_outlined, color: AppTheme.ochre, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.name, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: s.active ? AppTheme.ink : AppTheme.inkMuted)),
            const SizedBox(height: 2),
            Row(children: [
              Text('${s.duration} min', style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
              if (s.chairTime != null) ...[
                const Text('  ·  ', style: TextStyle(color: AppTheme.stoneBorder)),
                Text('${s.chairTime} min activo', style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
              ],
              if (s.price != null) ...[
                const Text('  ·  ', style: TextStyle(color: AppTheme.stoneBorder)),
                Text('${s.price!.toStringAsFixed(2)} €',
                    style: const TextStyle(fontSize: 12, color: AppTheme.ochre, fontWeight: FontWeight.w600)),
              ],
              if (s.capacity != null) ...[
                const Text('  ·  ', style: TextStyle(color: AppTheme.stoneBorder)),
                Text(s.capacity == 0 ? 'Ilimitado' : 'Aforo: ${s.capacity}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
                if (s.allowPartySize) ...[
                  const Text('  ·  ', style: TextStyle(color: AppTheme.stoneBorder)),
                  const Text('por grupos', style: TextStyle(fontSize: 12, color: AppTheme.blue, fontWeight: FontWeight.w500)),
                ],
              ],
              if (s.schedulingMode != 'ANY' && s.schedulingMode.isNotEmpty) ...[
                const Text('  ·  ', style: TextStyle(color: AppTheme.stoneBorder)),
                Text(s.schedulingMode == 'WEEKDAYS' ? 'Días específicos' : 'Fechas exactas',
                    style: const TextStyle(fontSize: 12, color: AppTheme.ochre, fontWeight: FontWeight.w500)),
              ],
            ]),
          ])),
          IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.inkMuted), onPressed: () => _openModal(svc: s)),
        ]),
      );

  Widget _sectionLabel(String label) => Text(label,
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
          color: AppTheme.inkMuted, letterSpacing: 0.5));

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

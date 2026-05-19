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
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/api/services');
      setState(() {
        _services = (data as List).map((e) => Service.fromJson(e)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _openModal({Service? svc}) {
    final nameCtrl = TextEditingController(text: svc?.name ?? '');
    final durCtrl = TextEditingController(text: svc?.duration.toString() ?? '');
    final capCtrl = TextEditingController(text: svc?.capacity?.toString() ?? '');
    final priceCtrl = TextEditingController(text: svc?.price?.toStringAsFixed(2) ?? '');
    bool hasPrice = svc?.price != null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(svc == null ? 'Nuevo servicio' : 'Editar servicio',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.ink)),
            const SizedBox(height: 20),
            _field('Nombre del servicio', nameCtrl),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _field('Duración (min)', durCtrl, type: TextInputType.number)),
              const SizedBox(width: 12),
              Expanded(child: _field('Aforo (opcional)', capCtrl, type: TextInputType.number)),
            ]),
            const SizedBox(height: 12),
            Row(
              children: [
                Checkbox(
                  value: hasPrice,
                  onChanged: (v) => setModal(() => hasPrice = v ?? false),
                  activeColor: AppTheme.blue,
                ),
                const Text('Añadir precio', style: TextStyle(fontSize: 14, color: AppTheme.ink)),
              ],
            ),
            if (hasPrice) ...[
              const SizedBox(height: 4),
              _field('Precio (€)', priceCtrl, type: const TextInputType.numberWithOptions(decimal: true)),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                try {
                  final body = {
                    'name': nameCtrl.text.trim(),
                    'duration': int.tryParse(durCtrl.text) ?? 30,
                    'capacity': capCtrl.text.isEmpty ? null : int.tryParse(capCtrl.text),
                    'price': hasPrice && priceCtrl.text.isNotEmpty ? double.tryParse(priceCtrl.text.replaceAll(',', '.')) : null,
                  };
                  if (svc == null) {
                    await ApiService.post('/api/services', body);
                  } else {
                    await ApiService.put('/api/services/${svc.id}', body);
                  }
                  if (ctx.mounted) Navigator.pop(ctx);
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
              child: Text(svc == null ? 'Crear servicio' : 'Guardar cambios',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ]),
        ),
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
              if (s.price != null) ...[
                const Text('  ·  ', style: TextStyle(color: AppTheme.stoneBorder)),
                Text('${s.price!.toStringAsFixed(2)} €',
                    style: const TextStyle(fontSize: 12, color: AppTheme.ochre, fontWeight: FontWeight.w600)),
              ],
              if (s.capacity != null) ...[
                const Text('  ·  ', style: TextStyle(color: AppTheme.stoneBorder)),
                Text('Aforo: ${s.capacity}', style: const TextStyle(fontSize: 12, color: AppTheme.inkMuted)),
              ],
            ]),
          ])),
          IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.inkMuted), onPressed: () => _openModal(svc: s)),
        ]),
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

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../app_theme.dart';
import '../../services/api_service.dart';

class MoreTab extends StatefulWidget {
  const MoreTab({super.key});

  @override
  State<MoreTab> createState() => _MoreTabState();
}

class _MoreTabState extends State<MoreTab> {
  String _userName = '';

  @override
  void initState() {
    super.initState();
    ApiService.getUserName().then((n) => setState(() => _userName = n));
  }

  Future<void> _logout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cerrar sesión'),
        content: const Text('¿Seguro que quieres cerrar sesión?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Salir', style: TextStyle(color: AppTheme.errorColor))),
        ],
      ),
    );
    if (ok == true) {
      await ApiService.clearToken();
      if (mounted) context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_userName.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: AppTheme.cardDecoration(bg: AppTheme.blue),
            child: Row(children: [
              CircleAvatar(
                backgroundColor: AppTheme.ochre,
                child: Text(_userName[0].toUpperCase(), style: const TextStyle(color: AppTheme.white, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_userName, style: const TextStyle(color: AppTheme.white, fontSize: 15, fontWeight: FontWeight.w600)),
                const Text('Propietario', style: TextStyle(color: Colors.white60, fontSize: 12)),
              ]),
            ]),
          ),
        _section('Configuración'),
        _item(Icons.schedule_outlined, 'Horarios de trabajo', () => context.push('/hours')),
        _item(Icons.business_outlined, 'Datos del negocio', () => context.push('/empresa')),
        const SizedBox(height: 8),
        _section('Sesión'),
        _item(Icons.logout, 'Cerrar sesión', _logout, color: AppTheme.errorColor),
      ],
    );
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 8, 0, 6),
        child: Text(title.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.inkMuted, letterSpacing: 0.8)),
      );

  Widget _item(IconData icon, String title, VoidCallback onTap, {Color? color}) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: AppTheme.cardDecoration(),
        child: ListTile(
          leading: Icon(icon, color: color ?? AppTheme.blue, size: 22),
          title: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: color ?? AppTheme.ink)),
          trailing: const Icon(Icons.chevron_right, color: AppTheme.stoneBorder, size: 20),
          onTap: onTap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
}

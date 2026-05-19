import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  int _tab = 0; // 0=login, 1=registro
  final _emailCtrl = TextEditingController(text: 'demo@fresco.app');
  final _passCtrl = TextEditingController(text: 'demo1234');
  final _regNameCtrl = TextEditingController();
  final _regBusinessCtrl = TextEditingController();
  final _regEmailCtrl = TextEditingController();
  final _regPassCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _success;
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose(); _passCtrl.dispose();
    _regNameCtrl.dispose(); _regBusinessCtrl.dispose();
    _regEmailCtrl.dispose(); _regPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.post('/api/auth/login', {
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
      });
      await ApiService.setToken(data['token'], data['name'] ?? '', data['role'] ?? '');
      if (mounted) context.go('/dashboard');
    } catch (e) {
      final msg = e.toString();
      setState(() => _error = msg.contains('401') || msg.contains('403')
          ? 'Email o contraseña incorrectos.'
          : 'No se puede conectar al servidor. ¿Está el backend iniciado?');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _register() async {
    if (_regBusinessCtrl.text.trim().isEmpty || _regEmailCtrl.text.trim().isEmpty || _regPassCtrl.text.isEmpty) {
      setState(() => _error = 'Rellena todos los campos obligatorios.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ApiService.post('/api/auth/register', {
        'businessName': _regBusinessCtrl.text.trim(),
        'ownerName': _regNameCtrl.text.trim(),
        'email': _regEmailCtrl.text.trim(),
        'password': _regPassCtrl.text,
      });
      setState(() { _success = '¡Cuenta creada! Ya puedes iniciar sesión.'; _tab = 0; });
    } catch (_) {
      setState(() => _error = 'Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.stone,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // Mobile brand header
                Row(children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('fresco', style: GoogleFonts.cormorantGaramond(
                      fontSize: 32, fontWeight: FontWeight.w600, color: AppTheme.blue, letterSpacing: 3,
                    )),
                    Text('GESTIÓN DE CITAS', style: GoogleFonts.dmSans(
                      fontSize: 9, fontWeight: FontWeight.w400, letterSpacing: 3,
                      color: AppTheme.inkMuted,
                    )),
                  ]),
                  const SizedBox(width: 16),
                  Container(width: 1.5, height: 36, color: AppTheme.stoneBorder),
                  const SizedBox(width: 16),
                  Text('Portal de acceso', style: GoogleFonts.dmSans(
                    fontSize: 12, color: AppTheme.inkMuted, fontWeight: FontWeight.w300,
                  )),
                ]),
                const SizedBox(height: 36),

                // Title
                Text(_tab == 0 ? 'Bienvenido de' : 'Crear tu',
                    style: GoogleFonts.cormorantGaramond(fontSize: 40, fontWeight: FontWeight.w300, color: AppTheme.ink, height: 1.05)),
                Text(_tab == 0 ? 'vuelta.' : 'negocio.',
                    style: GoogleFonts.cormorantGaramond(fontSize: 40, fontWeight: FontWeight.w600,
                        fontStyle: FontStyle.italic, color: AppTheme.blue, height: 1.05)),
                const SizedBox(height: 8),
                Text(_tab == 0 ? 'Accede a tu panel de gestión de citas.' : 'Empieza gratis hoy mismo.',
                    style: GoogleFonts.dmSans(fontSize: 13, color: AppTheme.inkMuted, fontWeight: FontWeight.w300, height: 1.6)),
                const SizedBox(height: 28),

                // Tabs
                Row(children: [
                  _tabBtn('Iniciar sesión', 0),
                  const SizedBox(width: 20),
                  _tabBtn('Crear negocio', 1),
                ]),
                const SizedBox(height: 28),

                // Alert
                if (_error != null) _alert(_error!, isError: true),
                if (_success != null) _alert(_success!, isError: false),

                // Form
                if (_tab == 0) ...[
                  _marker('ACCESO'),
                  _field('Email', _emailCtrl, type: TextInputType.emailAddress),
                  const SizedBox(height: 12),
                  _field('Contraseña', _passCtrl, obscure: true),
                  const SizedBox(height: 16),
                  _btn(_tab == 0 ? 'Entrar' : 'Crear cuenta', _tab == 0 ? _login : _register),
                  const SizedBox(height: 20),
                  Center(child: Text('Acceso demo: demo@fresco.app / demo1234',
                      style: GoogleFonts.dmSans(fontSize: 11, color: AppTheme.inkMuted))),
                ] else ...[
                  _marker('DATOS DEL NEGOCIO'),
                  _field('Nombre del negocio *', _regBusinessCtrl),
                  const SizedBox(height: 12),
                  _marker('DATOS DEL PROPIETARIO'),
                  _field('Tu nombre', _regNameCtrl),
                  const SizedBox(height: 12),
                  _field('Email *', _regEmailCtrl, type: TextInputType.emailAddress),
                  const SizedBox(height: 12),
                  _field('Contraseña *', _regPassCtrl, obscure: true),
                  const SizedBox(height: 16),
                  _btn('Crear cuenta', _register),
                ],
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _tabBtn(String label, int idx) {
    final active = _tab == idx;
    return GestureDetector(
      onTap: () => setState(() { _tab = idx; _error = null; _success = null; }),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: GoogleFonts.dmSans(
          fontSize: 13, fontWeight: FontWeight.w500,
          color: active ? AppTheme.blue : AppTheme.inkMuted,
        )),
        const SizedBox(height: 6),
        Container(height: 2, width: label.length * 7.2,
          color: active ? AppTheme.ochre : Colors.transparent),
      ]),
    );
  }

  Widget _marker(String label) => Padding(
    padding: const EdgeInsets.only(bottom: 14, top: 4),
    child: Row(children: [
      Container(width: 3, height: 3, decoration: const BoxDecoration(color: AppTheme.ochre, shape: BoxShape.circle)),
      const SizedBox(width: 8),
      Text(label, style: GoogleFonts.dmSans(fontSize: 10, fontWeight: FontWeight.w500,
          letterSpacing: 2, color: AppTheme.inkMuted)),
      const SizedBox(width: 8),
      Expanded(child: Container(height: 1, color: AppTheme.stoneBorder)),
    ]),
  );

  Widget _field(String label, TextEditingController ctrl, {TextInputType? type, bool obscure = false}) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: GoogleFonts.dmSans(fontSize: 10, fontWeight: FontWeight.w500,
          letterSpacing: 1.5, color: AppTheme.inkMuted)),
      const SizedBox(height: 6),
      TextField(
        controller: ctrl,
        keyboardType: type,
        obscureText: obscure && _obscure,
        style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w300, color: AppTheme.ink),
        decoration: InputDecoration(
          filled: true, fillColor: AppTheme.white,
          hintStyle: GoogleFonts.dmSans(color: AppTheme.inkMuted.withValues(alpha: 0.4), fontSize: 13),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: AppTheme.stoneBorder, width: 1.5)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: AppTheme.stoneBorder, width: 1.5)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: AppTheme.blue, width: 1.5)),
          suffixIcon: obscure ? IconButton(
            icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18, color: AppTheme.inkMuted),
            onPressed: () => setState(() => _obscure = !_obscure),
          ) : null,
        ),
      ),
    ],
  );

  Widget _btn(String label, VoidCallback onTap) => SizedBox(
    width: double.infinity,
    child: ElevatedButton(
      onPressed: _loading ? null : onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.blueMid,
        foregroundColor: AppTheme.white,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        elevation: 4,
        shadowColor: const Color(0xFF08081E).withValues(alpha: 0.3),
      ),
      child: _loading
          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: AppTheme.white, strokeWidth: 2))
          : Text(label, style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.5)),
    ),
  );

  Widget _alert(String msg, {required bool isError}) => Container(
    margin: const EdgeInsets.only(bottom: 14),
    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
    decoration: BoxDecoration(
      color: isError ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
      border: Border.all(color: isError ? const Color(0xFFFCA5A5) : const Color(0xFF86EFAC)),
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(msg, style: GoogleFonts.dmSans(fontSize: 12.5, color: isError ? AppTheme.errorColor : AppTheme.success)),
  );
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';
import '../services/api_service.dart';
import 'empresa_screen.dart';
import 'tabs/overview_tab.dart';
import 'tabs/bookings_tab.dart';
import 'tabs/services_tab.dart';
import 'tabs/employees_tab.dart';
import 'tabs/clients_tab.dart';
import 'tabs/more_tab.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _idx = 0;
  bool? _hasBusinessHours;

  final _tabs = const [
    OverviewTab(),
    BookingsTab(),
    ServicesTab(),
    EmployeesTab(),
    ClientsTab(),
    MoreTab(),
  ];

  final _titles = ['Inicio', 'Reservas', 'Servicios', 'Empleados', 'Clientes', 'Más'];

  @override
  void initState() {
    super.initState();
    _checkHours();
  }

  Future<void> _checkHours() async {
    try {
      final data = await ApiService.get('/api/tenant/hours');
      if (mounted) {
        setState(() => _hasBusinessHours = data is List && data.isNotEmpty);
      }
    } catch (_) {
      if (mounted) setState(() => _hasBusinessHours = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: AppTheme.blue,
        toolbarHeight: 60,
        title: Row(mainAxisSize: MainAxisSize.min, children: [
          Text('fresco', style: AppTheme.serif(size: 22, weight: FontWeight.w600, color: AppTheme.white)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Container(width: 1, height: 16, color: AppTheme.white.withValues(alpha: 0.3)),
          ),
          Text(_titles[_idx], style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w400, color: AppTheme.white.withValues(alpha: 0.85))),
        ]),
      ),
      body: Column(
        children: [
          if (_hasBusinessHours == false)
            _NoHoursBanner(onTap: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const EmpresaScreen()));
              _checkHours();
            }),
          Expanded(child: IndexedStack(index: _idx, children: _tabs)),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.white,
          border: Border(top: BorderSide(color: AppTheme.stoneBorder)),
        ),
        child: NavigationBar(
          selectedIndex: _idx,
          onDestinationSelected: (i) => setState(() => _idx = i),
          backgroundColor: AppTheme.white,
          indicatorColor: AppTheme.blue.withValues(alpha: 0.08),
          elevation: 0,
          height: 64,
          destinations: [
            _dest(Icons.home_outlined, Icons.home_rounded, 'Inicio'),
            _dest(Icons.calendar_today_outlined, Icons.calendar_today_rounded, 'Reservas'),
            _dest(Icons.medical_services_outlined, Icons.medical_services_rounded, 'Servicios'),
            _dest(Icons.people_outline, Icons.people_rounded, 'Empleados'),
            _dest(Icons.person_search_outlined, Icons.person_search_rounded, 'Clientes'),
            _dest(Icons.more_horiz, Icons.more_horiz, 'Más'),
          ],
        ),
      ),
    );
  }

  NavigationDestination _dest(IconData icon, IconData selectedIcon, String label) => NavigationDestination(
        icon: Icon(icon, color: AppTheme.inkMuted, size: 22),
        selectedIcon: Icon(selectedIcon, color: AppTheme.blue, size: 22),
        label: label,
      );
}

class _NoHoursBanner extends StatelessWidget {
  final VoidCallback onTap;
  const _NoHoursBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFFFFBEB),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          const Text('⚠️', style: TextStyle(fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sin horario configurado',
                  style: GoogleFonts.dmSans(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF92400E)),
                ),
                Text(
                  'Los clientes no pueden reservar hasta que lo configures.',
                  style: GoogleFonts.dmSans(fontSize: 11, color: const Color(0xFF92400E)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFD97706),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'Configurar',
                style: GoogleFonts.dmSans(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

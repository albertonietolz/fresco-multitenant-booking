import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';
import 'tabs/overview_tab.dart';
import 'tabs/bookings_tab.dart';
import 'tabs/services_tab.dart';
import 'tabs/employees_tab.dart';
import 'tabs/more_tab.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _idx = 0;

  final _tabs = const [
    OverviewTab(),
    BookingsTab(),
    ServicesTab(),
    EmployeesTab(),
    MoreTab(),
  ];

  final _titles = ['Inicio', 'Reservas', 'Servicios', 'Empleados', 'Más'];

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
      body: IndexedStack(index: _idx, children: _tabs),
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

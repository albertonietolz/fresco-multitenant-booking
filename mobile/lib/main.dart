import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:go_router/go_router.dart';
import 'app_theme.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/booking_flow_screen.dart';
import 'screens/employee_portal_screen.dart';
import 'screens/hours_screen.dart';
import 'screens/empresa_screen.dart';

void main() {
  usePathUrlStrategy();
  runApp(const FrescoApp());
}

final _router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final token = await ApiService.getToken();
    final path = state.uri.path;
    final isPublic = path.contains('/booking') || path.contains('/employee');
    if (token == null && path != '/' && !isPublic) return '/';
    if (token != null && path == '/') return '/dashboard';
    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (context, state) => const LoginScreen()),
    GoRoute(path: '/dashboard', builder: (context, state) => const DashboardScreen()),
    GoRoute(
      path: '/:slug/booking',
      builder: (context, state) => BookingFlowScreen(slug: state.pathParameters['slug'] ?? 'fisiovital'),
    ),
    GoRoute(
      path: '/:slug/employee',
      builder: (context, state) => EmployeePortalScreen(slug: state.pathParameters['slug'] ?? 'fisiovital'),
    ),
    GoRoute(path: '/hours', builder: (context, state) => const HoursScreen()),
    GoRoute(path: '/empresa', builder: (context, state) => const EmpresaScreen()),
  ],
);

class FrescoApp extends StatelessWidget {
  const FrescoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Fresco',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      routerConfig: _router,
    );
  }
}

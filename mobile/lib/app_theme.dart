import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color blue = Color(0xFF1a3070);
  static const Color blueMid = Color(0xFF2b4590);
  static const Color blueLight = Color(0xFF3d5aac);
  static const Color ochre = Color(0xFFc9973a);
  static const Color ochreDim = Color(0x20c9973a);
  static const Color stone = Color(0xFFf4f0e6);
  static const Color stoneBorder = Color(0xFFd8cfc0);
  static const Color white = Color(0xFFffffff);
  static const Color ink = Color(0xFF110e0a);
  static const Color inkMuted = Color(0xFF6a5f52);
  static const Color success = Color(0xFF15803d);
  static const Color successDim = Color(0x2015803d);
  static const Color errorColor = Color(0xFFdc2626);
  static const Color errorDim = Color(0x20dc2626);
  static const Color warningColor = Color(0xFFd97706);
  static const Color warningDim = Color(0x20d97706);

  static TextStyle serif({double size = 16, FontWeight weight = FontWeight.w600, Color color = white}) =>
      GoogleFonts.cormorantGaramond(fontSize: size, fontWeight: weight, color: color, letterSpacing: 0.5);

  static TextStyle sans({double size = 14, FontWeight weight = FontWeight.w400, Color color = ink}) =>
      GoogleFonts.dmSans(fontSize: size, fontWeight: weight, color: color);

  static ThemeData get theme => ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: blue,
          primary: blue,
          secondary: ochre,
          surface: stone,
        ),
        scaffoldBackgroundColor: stone,
        textTheme: GoogleFonts.dmSansTextTheme(),
        appBarTheme: AppBarTheme(
          backgroundColor: blue,
          foregroundColor: white,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: GoogleFonts.dmSans(
            color: white,
            fontSize: 17,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: white,
          indicatorColor: blue.withValues(alpha: 0.1),
          labelTextStyle: WidgetStateProperty.resolveWith((states) => GoogleFonts.dmSans(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w600 : FontWeight.w400,
            color: states.contains(WidgetState.selected) ? blue : inkMuted,
          )),
        ),
        useMaterial3: true,
      );

  static Color statusColor(String status) {
    switch (status) {
      case 'CONFIRMED': return success;
      case 'PENDING': return warningColor;
      case 'CANCELLED': return errorColor;
      default: return inkMuted;
    }
  }

  static Color statusBg(String status) {
    switch (status) {
      case 'CONFIRMED': return successDim;
      case 'PENDING': return warningDim;
      case 'CANCELLED': return errorDim;
      default: return stone;
    }
  }

  static String statusLabel(String status) {
    switch (status) {
      case 'CONFIRMED': return 'Confirmada';
      case 'PENDING': return 'Pendiente';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  }

  static BoxDecoration cardDecoration({Color? bg}) => BoxDecoration(
        color: bg ?? white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: stoneBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      );

  static InputDecoration inputDec(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.dmSans(color: inkMuted, fontSize: 14),
        filled: true,
        fillColor: stone,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: stoneBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: stoneBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: blue, width: 1.5)),
      );
}

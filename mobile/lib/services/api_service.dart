import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:8080';
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:8080';
    return 'http://localhost:8080';
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> setToken(String token, String name, String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('userName', name);
    await prefs.setString('userRole', role);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userName');
    await prefs.remove('userRole');
  }

  static Future<String> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userName') ?? '';
  }

  static Future<Map<String, String>> _authHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static dynamic _decode(http.Response res) {
    if (res.statusCode >= 400) {
      throw Exception('Error ${res.statusCode}: ${res.body}');
    }
    if (res.body.isEmpty) return null;
    return jsonDecode(utf8.decode(res.bodyBytes));
  }

  static Future<dynamic> get(String path) async {
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: await _authHeaders());
    return _decode(res);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse('$baseUrl$path'),
        headers: await _authHeaders(), body: jsonEncode(body));
    return _decode(res);
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final res = await http.put(Uri.parse('$baseUrl$path'),
        headers: await _authHeaders(), body: jsonEncode(body));
    return _decode(res);
  }

  static Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    final res = await http.patch(Uri.parse('$baseUrl$path'),
        headers: await _authHeaders(), body: jsonEncode(body));
    return _decode(res);
  }

  static Future<void> delete(String path) async {
    final res = await http.delete(Uri.parse('$baseUrl$path'), headers: await _authHeaders());
    if (res.statusCode >= 400) throw Exception('Error ${res.statusCode}: ${res.body}');
  }

  static Future<dynamic> pubGet(String path) async {
    final res = await http.get(Uri.parse('$baseUrl$path'),
        headers: {'Content-Type': 'application/json'});
    return _decode(res);
  }

  static Future<dynamic> pubPost(String path, Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse('$baseUrl$path'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode(body));
    return _decode(res);
  }
}

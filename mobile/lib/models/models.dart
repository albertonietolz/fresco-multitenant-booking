class Tenant {
  final int id;
  final String name;
  final String slug;
  final String? email;
  final String? phone;
  final String? address;
  final int? maxCapacity;
  final bool allowEmployeeChoice;

  Tenant({required this.id, required this.name, required this.slug, this.email, this.phone, this.address, this.maxCapacity, required this.allowEmployeeChoice});

  factory Tenant.fromJson(Map<String, dynamic> j) => Tenant(
        id: j['id'],
        name: j['name'],
        slug: j['slug'],
        email: j['email'],
        phone: j['phone'],
        address: j['address'],
        maxCapacity: j['maxCapacity'],
        allowEmployeeChoice: j['allowEmployeeChoice'] ?? false,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'email': email,
        'phone': phone,
        'address': address,
        'maxCapacity': maxCapacity,
        'allowEmployeeChoice': allowEmployeeChoice,
      };
}

class Service {
  final int id;
  final String name;
  final int duration;
  final int? capacity;
  final double? price;
  final bool active;

  Service({required this.id, required this.name, required this.duration, this.capacity, this.price, required this.active});

  factory Service.fromJson(Map<String, dynamic> j) => Service(
        id: j['id'],
        name: j['name'],
        duration: j['duration'],
        capacity: j['capacity'],
        price: j['price'] != null ? (j['price'] as num).toDouble() : null,
        active: j['active'] ?? true,
      );
}

class Employee {
  final int id;
  final String name;
  final String? email;
  final String? phone;
  final bool active;
  final List<int> serviceIds;
  final bool hasPinSet;
  final String? pin;

  Employee({required this.id, required this.name, this.email, this.phone, required this.active, required this.serviceIds, required this.hasPinSet, this.pin});

  factory Employee.fromJson(Map<String, dynamic> j) => Employee(
        id: j['id'],
        name: j['name'],
        email: j['email'],
        phone: j['phone'],
        active: j['active'] ?? true,
        serviceIds: (j['serviceIds'] as List?)?.map((e) => (e as num).toInt()).toList() ?? [],
        hasPinSet: j['hasPinSet'] ?? false,
        pin: j['pin'],
      );
}

class Booking {
  final int id;
  final int? employeeId;
  final int? serviceId;
  final String customerName;
  final String? customerEmail;
  final String? customerPhone;
  final String date;
  final String startTime;
  final String status;
  final String? notes;

  Booking({required this.id, this.employeeId, this.serviceId, required this.customerName, this.customerEmail, this.customerPhone, required this.date, required this.startTime, required this.status, this.notes});

  factory Booking.fromJson(Map<String, dynamic> j) => Booking(
        id: j['id'],
        employeeId: j['employeeId'],
        serviceId: j['serviceId'],
        customerName: j['customerName'],
        customerEmail: j['customerEmail'],
        customerPhone: j['customerPhone'],
        date: _parseDate(j['date']),
        startTime: _parseTime(j['startTime']),
        status: j['status'],
        notes: j['notes'],
      );

  static String _parseDate(dynamic d) {
    if (d is List) {
      return '${d[0]}-${d[1].toString().padLeft(2, '0')}-${d[2].toString().padLeft(2, '0')}';
    }
    return d.toString();
  }

  static String _parseTime(dynamic t) {
    if (t is List) {
      return '${t[0].toString().padLeft(2, '0')}:${t[1].toString().padLeft(2, '0')}';
    }
    return t.toString().substring(0, 5);
  }
}

class WorkingHours {
  final int id;
  final int? employeeId;
  final String dayOfWeek;
  final String startTime;
  final String endTime;

  WorkingHours({required this.id, this.employeeId, required this.dayOfWeek, required this.startTime, required this.endTime});

  factory WorkingHours.fromJson(Map<String, dynamic> j) => WorkingHours(
        id: j['id'],
        employeeId: j['employeeId'],
        dayOfWeek: j['dayOfWeek'],
        startTime: _t(j['startTime']),
        endTime: _t(j['endTime']),
      );

  static String _t(dynamic t) {
    if (t is List) return '${t[0].toString().padLeft(2, '0')}:${t[1].toString().padLeft(2, '0')}';
    return t.toString().substring(0, 5);
  }

  String get dayLabel {
    const map = {
      'MONDAY': 'Lunes', 'TUESDAY': 'Martes', 'WEDNESDAY': 'Miércoles',
      'THURSDAY': 'Jueves', 'FRIDAY': 'Viernes', 'SATURDAY': 'Sábado', 'SUNDAY': 'Domingo',
    };
    return map[dayOfWeek] ?? dayOfWeek;
  }
}

class TenantDocument {
  final int id;
  final String displayName;
  final String fileName;

  TenantDocument({required this.id, required this.displayName, required this.fileName});

  factory TenantDocument.fromJson(Map<String, dynamic> j) => TenantDocument(
        id: j['id'],
        displayName: j['displayName'],
        fileName: j['fileName'],
      );
}

class ScheduleBookingSlot {
  final String startTime;
  final String endTime;
  final String clientName;
  final String serviceName;
  final String status;
  final int durationMinutes;

  ScheduleBookingSlot({required this.startTime, required this.endTime, required this.clientName, required this.serviceName, required this.status, required this.durationMinutes});

  factory ScheduleBookingSlot.fromJson(Map<String, dynamic> j) => ScheduleBookingSlot(
        startTime: j['startTime'],
        endTime: j['endTime'],
        clientName: j['clientName'],
        serviceName: j['serviceName'],
        status: j['status'],
        durationMinutes: j['durationMinutes'] ?? 30,
      );
}

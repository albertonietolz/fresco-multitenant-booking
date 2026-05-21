-- Test data for fisiovital tenant
-- Run in pgAdmin after confirming the fisiovital tenant exists with slug = 'fisiovital'

DO $$
DECLARE
  tid        BIGINT;
  svc1       BIGINT;  -- Masaje deportivo 60min
  svc2       BIGINT;  -- Consulta inicial 30min
  svc3       BIGINT;  -- Fisioterapia grupal 90min cap:5
  svc4       BIGINT;  -- Electroterapia 45min
  svc5       BIGINT;  -- Kinesiotaping 30min
  emp1       BIGINT;  -- Ana García
  emp2       BIGINT;  -- Carlos López
  emp3       BIGINT;  -- María Torres
BEGIN

  SELECT id INTO tid FROM tenants WHERE slug = 'fisiovital';
  IF tid IS NULL THEN RAISE EXCEPTION 'Tenant fisiovital not found'; END IF;

  -- ── SERVICES ──────────────────────────────────────────────────────────────
  INSERT INTO services (tenant_id, name, duration, capacity, chair_time, price, active, default_employee_id)
  VALUES
    (tid, 'Masaje deportivo',     60, NULL, NULL, 55.00, true, NULL),
    (tid, 'Consulta inicial',     30, NULL, NULL, 40.00, true, NULL),
    (tid, 'Fisioterapia grupal',  90,    5, NULL, 25.00, true, NULL),
    (tid, 'Electroterapia',       45, NULL, NULL, 35.00, true, NULL),
    (tid, 'Kinesiotaping',        30, NULL, NULL, 30.00, true, NULL)
  ON CONFLICT DO NOTHING;

  SELECT id INTO svc1 FROM services WHERE tenant_id = tid AND name = 'Masaje deportivo';
  SELECT id INTO svc2 FROM services WHERE tenant_id = tid AND name = 'Consulta inicial';
  SELECT id INTO svc3 FROM services WHERE tenant_id = tid AND name = 'Fisioterapia grupal';
  SELECT id INTO svc4 FROM services WHERE tenant_id = tid AND name = 'Electroterapia';
  SELECT id INTO svc5 FROM services WHERE tenant_id = tid AND name = 'Kinesiotaping';

  -- ── EMPLOYEES ─────────────────────────────────────────────────────────────
  INSERT INTO employees (tenant_id, name, email, phone, active, pin, pin_hash)
  VALUES
    (tid, 'Ana García',    'ana@fisiovital.es',    '611000001', true, NULL, NULL),
    (tid, 'Carlos López',  'carlos@fisiovital.es', '611000002', true, NULL, NULL),
    (tid, 'María Torres',  'maria@fisiovital.es',  '611000003', true, NULL, NULL)
  ON CONFLICT DO NOTHING;

  SELECT id INTO emp1 FROM employees WHERE tenant_id = tid AND name = 'Ana García';
  SELECT id INTO emp2 FROM employees WHERE tenant_id = tid AND name = 'Carlos López';
  SELECT id INTO emp3 FROM employees WHERE tenant_id = tid AND name = 'María Torres';

  -- Ana atiende: Masaje deportivo, Consulta inicial, Kinesiotaping
  INSERT INTO employee_services (employee_id, service_id) VALUES
    (emp1, svc1), (emp1, svc2), (emp1, svc5)
  ON CONFLICT DO NOTHING;

  -- Carlos atiende: Electroterapia, Consulta inicial, Fisioterapia grupal
  INSERT INTO employee_services (employee_id, service_id) VALUES
    (emp2, svc4), (emp2, svc2), (emp2, svc3)
  ON CONFLICT DO NOTHING;

  -- María atiende: Masaje deportivo, Fisioterapia grupal, Kinesiotaping, Electroterapia
  INSERT INTO employee_services (employee_id, service_id) VALUES
    (emp3, svc1), (emp3, svc3), (emp3, svc5), (emp3, svc4)
  ON CONFLICT DO NOTHING;

  -- ── WORKING HOURS ─────────────────────────────────────────────────────────
  -- Ana: lunes-viernes 09:00-14:00
  INSERT INTO working_hours (tenant_id, employee_id, day_of_week, start_time, end_time)
  VALUES
    (tid, emp1, 'MONDAY',    '09:00', '14:00'),
    (tid, emp1, 'TUESDAY',   '09:00', '14:00'),
    (tid, emp1, 'WEDNESDAY', '09:00', '14:00'),
    (tid, emp1, 'THURSDAY',  '09:00', '14:00'),
    (tid, emp1, 'FRIDAY',    '09:00', '14:00')
  ON CONFLICT DO NOTHING;

  -- Carlos: lun/mié/vie 10:00-18:00
  INSERT INTO working_hours (tenant_id, employee_id, day_of_week, start_time, end_time)
  VALUES
    (tid, emp2, 'MONDAY',    '10:00', '18:00'),
    (tid, emp2, 'WEDNESDAY', '10:00', '18:00'),
    (tid, emp2, 'FRIDAY',    '10:00', '18:00')
  ON CONFLICT DO NOTHING;

  -- María: mar/jue/sáb 09:00-13:00
  INSERT INTO working_hours (tenant_id, employee_id, day_of_week, start_time, end_time)
  VALUES
    (tid, emp3, 'TUESDAY',   '09:00', '13:00'),
    (tid, emp3, 'THURSDAY',  '09:00', '13:00'),
    (tid, emp3, 'SATURDAY',  '09:00', '13:00')
  ON CONFLICT DO NOTHING;

  -- ── BOOKINGS (May 20 – June 21, 2026) ────────────────────────────────────
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes)
  VALUES
    -- Mayo
    (tid, emp1, svc2, 'Laura Martínez',   'laura@email.es',   '655100001', '2026-05-20', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Javier Ruiz',      'javier@email.es',  '655100002', '2026-05-20', '10:00', 'CONFIRMED', NOW(), 'Rodilla derecha'),
    (tid, emp3, svc1, 'Sara Gómez',       'sara@email.es',    '655100003', '2026-05-21', '09:00', 'PENDING',   NOW(), NULL),
    (tid, emp1, svc5, 'Pedro Álvarez',    'pedro@email.es',   '655100004', '2026-05-21', '11:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc3, 'Elena Torres',     'elena@email.es',   '655100005', '2026-05-21', '11:00', 'CONFIRMED', NOW(), 'Grupo rehabilitación'),
    (tid, emp2, svc3, 'Antonio Molina',   'antonio@email.es', '655100006', '2026-05-21', '11:00', 'CONFIRMED', NOW(), 'Grupo rehabilitación'),
    (tid, emp1, svc2, 'Lucía Fernández',  'lucia@email.es',   '655100007', '2026-05-22', '09:30', 'PENDING',   NOW(), NULL),
    (tid, emp2, svc4, 'Marcos Herrera',   'marcos@email.es',  '655100008', '2026-05-22', '14:00', 'CONFIRMED', NOW(), 'Hombro izquierdo'),
    (tid, emp3, svc5, 'Inés Castillo',   'ines@email.es',    '655100009', '2026-05-23', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'David Ramos',      'david@email.es',   '655100010', '2026-05-23', '10:00', 'PENDING',   NOW(), NULL),
    -- Junio primera semana
    (tid, emp1, svc2, 'Carmen Vega',      'carmen@email.es',  '655100011', '2026-06-01', '09:00', 'PENDING',   NOW(), NULL),
    (tid, emp2, svc4, 'Raúl Jiménez',    'raul@email.es',    '655100012', '2026-06-01', '10:00', 'CONFIRMED', NOW(), 'Columna lumbar'),
    (tid, emp3, svc1, 'Sofía Navarro',   'sofia@email.es',   '655100013', '2026-06-03', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc5, 'Hugo Blanco',      'hugo@email.es',    '655100014', '2026-06-05', '09:00', 'PENDING',   NOW(), NULL),
    (tid, emp2, svc3, 'Marta León',       'marta@email.es',   '655100015', '2026-06-05', '12:00', 'CONFIRMED', NOW(), NULL),
    -- Junio segunda semana
    (tid, emp1, svc2, 'Álvaro Moreno',   'alvaro@email.es',  '655100016', '2026-06-08', '10:00', 'PENDING',   NOW(), NULL),
    (tid, emp2, svc4, 'Beatriz Serrano', 'beatriz@email.es', '655100017', '2026-06-08', '16:00', 'CONFIRMED', NOW(), 'Tobillo'),
    (tid, emp3, svc5, 'Víctor Romero',  'victor@email.es',  '655100018', '2026-06-09', '11:00', 'CONFIRMED', NOW(), NULL),
    -- Junio tercera semana
    (tid, emp1, svc1, 'Nuria Campos',    'nuria@email.es',   '655100019', '2026-06-15', '09:00', 'PENDING',   NOW(), NULL),
    (tid, emp2, svc2, 'Pablo Reyes',      'pablo@email.es',   '655100020', '2026-06-17', '10:00', 'CONFIRMED', NOW(), 'Primera visita'),
    -- Hasta el 21 de junio
    (tid, emp3, svc1, 'Isabel Cruz',     'isabel@email.es',  '655100021', '2026-06-19', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc5, 'Fernando Gil',    'fernando@email.es','655100022', '2026-06-19', '11:30', 'PENDING',   NOW(), NULL),
    (tid, emp2, svc4, 'Amparo Soto',     'amparo@email.es',  '655100023', '2026-06-19', '14:00', 'CONFIRMED', NOW(), 'Rodilla izquierda'),
    (tid, emp3, svc3, 'Roberto Peña',    'roberto@email.es', '655100024', '2026-06-20', '09:00', 'PENDING',   NOW(), NULL),
    (tid, emp1, svc2, 'Consuelo Lara',   'consuelo@email.es','655100025', '2026-06-21', '09:30', 'PENDING',   NOW(), NULL),
    (tid, emp2, svc4, 'Andrés Fuentes',  'andres@email.es',  '655100026', '2026-06-21', '10:00', 'CONFIRMED', NOW(), 'Seguimiento');

END $$;

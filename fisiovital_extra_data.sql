-- Datos extra para fisiovital: empleado nuevo, campos personalizados,
-- días cerrados, días llenos, días con poco hueco y reservas con campos.

DO $$
DECLARE
  tid   BIGINT;
  svc1  BIGINT;  -- Masaje deportivo 60min
  svc2  BIGINT;  -- Consulta inicial 30min
  svc3  BIGINT;  -- Fisioterapia grupal 90min
  svc4  BIGINT;  -- Electroterapia 45min
  svc5  BIGINT;  -- Kinesiotaping 30min
  emp1  BIGINT;  -- Ana García      L-V 09-14
  emp2  BIGINT;  -- Carlos López    L/X/V 10-18
  emp3  BIGINT;  -- María Torres    M/J/S 09-13
  emp4  BIGINT;  -- Diego Pérez (nuevo) M/J 15-20, S 10-14
  cf1   BIGINT;  -- Campo: Zona a tratar (Masaje deportivo)
  cf2   BIGINT;  -- Campo: Intensidad deseada (Masaje deportivo)
  cf3   BIGINT;  -- Campo: Motivo de la consulta (Consulta inicial)
  bk_id BIGINT;
BEGIN

  SELECT id INTO tid FROM tenants WHERE slug = 'fisiovital';
  IF tid IS NULL THEN RAISE EXCEPTION 'Tenant fisiovital not found'; END IF;

  SELECT id INTO svc1 FROM services WHERE tenant_id = tid AND name = 'Masaje deportivo';
  SELECT id INTO svc2 FROM services WHERE tenant_id = tid AND name = 'Consulta inicial';
  SELECT id INTO svc3 FROM services WHERE tenant_id = tid AND name = 'Fisioterapia grupal';
  SELECT id INTO svc4 FROM services WHERE tenant_id = tid AND name = 'Electroterapia';
  SELECT id INTO svc5 FROM services WHERE tenant_id = tid AND name = 'Kinesiotaping';
  SELECT id INTO emp1 FROM employees WHERE tenant_id = tid AND name = 'Ana García';
  SELECT id INTO emp2 FROM employees WHERE tenant_id = tid AND name = 'Carlos López';
  SELECT id INTO emp3 FROM employees WHERE tenant_id = tid AND name = 'María Torres';

  -- ── EMPLEADO NUEVO: Diego Pérez (tarde) ───────────────────────────────────
  INSERT INTO employees (tenant_id, name, email, phone, active, pin, pin_hash)
  VALUES (tid, 'Diego Pérez', 'diego@fisiovital.es', '611000004', true, NULL, NULL)
  ON CONFLICT DO NOTHING;
  SELECT id INTO emp4 FROM employees WHERE tenant_id = tid AND name = 'Diego Pérez';

  INSERT INTO employee_services (employee_id, service_id)
  SELECT emp4, svc4 WHERE NOT EXISTS (
    SELECT 1 FROM employee_services WHERE employee_id = emp4 AND service_id = svc4);
  INSERT INTO employee_services (employee_id, service_id)
  SELECT emp4, svc1 WHERE NOT EXISTS (
    SELECT 1 FROM employee_services WHERE employee_id = emp4 AND service_id = svc1);

  -- Horario Diego: mar/jue 15:00-20:00, sábado 10:00-14:00
  INSERT INTO working_hours (tenant_id, employee_id, day_of_week, start_time, end_time)
  SELECT tid, emp4, 'TUESDAY',  '15:00', '20:00'
  WHERE NOT EXISTS (SELECT 1 FROM working_hours WHERE employee_id = emp4 AND day_of_week = 'TUESDAY');

  INSERT INTO working_hours (tenant_id, employee_id, day_of_week, start_time, end_time)
  SELECT tid, emp4, 'THURSDAY', '15:00', '20:00'
  WHERE NOT EXISTS (SELECT 1 FROM working_hours WHERE employee_id = emp4 AND day_of_week = 'THURSDAY');

  INSERT INTO working_hours (tenant_id, employee_id, day_of_week, start_time, end_time)
  SELECT tid, emp4, 'SATURDAY', '10:00', '14:00'
  WHERE NOT EXISTS (SELECT 1 FROM working_hours WHERE employee_id = emp4 AND day_of_week = 'SATURDAY');

  -- ── CAMPOS PERSONALIZADOS ─────────────────────────────────────────────────
  -- Masaje deportivo: zona + intensidad
  IF NOT EXISTS (SELECT 1 FROM custom_fields WHERE tenant_id = tid AND service_id = svc1 AND label = 'Zona a tratar') THEN
    INSERT INTO custom_fields (tenant_id, service_id, label, field_type, required, field_order)
    VALUES (tid, svc1, 'Zona a tratar', 'TEXT', true, 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM custom_fields WHERE tenant_id = tid AND service_id = svc1 AND label = 'Intensidad deseada') THEN
    INSERT INTO custom_fields (tenant_id, service_id, label, field_type, required, field_order)
    VALUES (tid, svc1, 'Intensidad deseada', 'SELECT', false, 2);
  END IF;

  -- Consulta inicial: motivo + lesión previa
  IF NOT EXISTS (SELECT 1 FROM custom_fields WHERE tenant_id = tid AND service_id = svc2 AND label = 'Motivo de la consulta') THEN
    INSERT INTO custom_fields (tenant_id, service_id, label, field_type, required, field_order)
    VALUES (tid, svc2, 'Motivo de la consulta', 'TEXT', true, 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM custom_fields WHERE tenant_id = tid AND service_id = svc2 AND label = '¿Tienes alguna lesión previa?') THEN
    INSERT INTO custom_fields (tenant_id, service_id, label, field_type, required, field_order)
    VALUES (tid, svc2, '¿Tienes alguna lesión previa?', 'SELECT', false, 2);
  END IF;

  SELECT id INTO cf1 FROM custom_fields WHERE tenant_id = tid AND service_id = svc1 AND label = 'Zona a tratar';
  SELECT id INTO cf2 FROM custom_fields WHERE tenant_id = tid AND service_id = svc1 AND label = 'Intensidad deseada';
  SELECT id INTO cf3 FROM custom_fields WHERE tenant_id = tid AND service_id = svc2 AND label = 'Motivo de la consulta';

  -- ── DÍAS CERRADOS ─────────────────────────────────────────────────────────
  -- 6 jun (sábado) — festivo local
  -- 24 jun (miércoles) — San Juan
  INSERT INTO closed_dates (tenant_id, date) VALUES (tid, '2026-06-06') ON CONFLICT DO NOTHING;
  INSERT INTO closed_dates (tenant_id, date) VALUES (tid, '2026-06-24') ON CONFLICT DO NOTHING;

  -- ── DÍAS LLENOS ───────────────────────────────────────────────────────────
  -- 5 junio (viernes): Ana llena con Masaje deportivo 09-13h (5 huecos × 60min)
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes) VALUES
    (tid, emp1, svc1, 'Tomás Morales',   'tomas@test.es',      '655200001', '2026-06-05', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Rita Vidal',      'rita@test.es',       '655200002', '2026-06-05', '10:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Sergio Pardo',    'sergio@test.es',     '655200003', '2026-06-05', '11:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Noelia Campos',   'noelia@test.es',     '655200004', '2026-06-05', '12:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Gonzalo Reina',   'gonzalo@test.es',    '655200005', '2026-06-05', '13:00', 'CONFIRMED', NOW(), NULL);

  -- 5 junio (viernes): Carlos lleno con Electroterapia 10-18h (10 huecos × 45min)
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes) VALUES
    (tid, emp2, svc4, 'Eva Montoya',     'eva@test.es',        '655200006', '2026-06-05', '10:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Luis Cano',       'luis@test.es',       '655200007', '2026-06-05', '10:45', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Pilar Vera',      'pilar@test.es',      '655200008', '2026-06-05', '11:30', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Álex Prieto',     'alex@test.es',       '655200009', '2026-06-05', '12:15', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Dolores Moya',    'dolores@test.es',    '655200010', '2026-06-05', '13:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Ramón Toro',      'ramon@test.es',      '655200011', '2026-06-05', '13:45', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Cristina Abad',   'cristina@test.es',   '655200012', '2026-06-05', '14:30', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Manuel Vázquez',  'manuel@test.es',     '655200013', '2026-06-05', '15:15', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Rosa Alarcón',    'rosa@test.es',       '655200014', '2026-06-05', '16:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp2, svc4, 'Ignacio Peña',    'ignacio@test.es',    '655200015', '2026-06-05', '16:45', 'CONFIRMED', NOW(), NULL);

  -- 9 junio (martes): María llena con Masaje deportivo 09-13h (4 huecos × 60min)
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes) VALUES
    (tid, emp3, svc1, 'Patricia Llano',  'patricia@test.es',   '655200016', '2026-06-09', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp3, svc1, 'Héctor Blázquez', 'hector@test.es',     '655200017', '2026-06-09', '10:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp3, svc1, 'Yolanda Chávez',  'yolanda@test.es',    '655200018', '2026-06-09', '11:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp3, svc1, 'Borja Iglesias',  'borja@test.es',      '655200019', '2026-06-09', '12:00', 'CONFIRMED', NOW(), NULL);

  -- 12 junio (viernes): Ana llena con Masaje deportivo
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes) VALUES
    (tid, emp1, svc1, 'Verónica Salas',    'veronica@test.es',   '655200020', '2026-06-12', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Joaquín Crespo',    'joaquin@test.es',    '655200021', '2026-06-12', '10:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Remedios Gil',      'remedios@test.es',   '655200022', '2026-06-12', '11:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Emilio Vargas',     'emilio@test.es',     '655200023', '2026-06-12', '12:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp1, svc1, 'Concepción Ruiz',   'concepcion@test.es', '655200024', '2026-06-12', '13:00', 'CONFIRMED', NOW(), NULL);

  -- ── DÍA CON POCO HUECO ────────────────────────────────────────────────────
  -- 16 junio (martes): María solo 2 de 4 huecos ocupados (Kinesiotaping 30min)
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes) VALUES
    (tid, emp3, svc5, 'Alicia Méndez',    'alicia@test.es',     '655200025', '2026-06-16', '09:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp3, svc5, 'Celia Domínguez',  'celia@test.es',      '655200026', '2026-06-16', '09:30', 'CONFIRMED', NOW(), NULL);

  -- ── DIEGO: reservas en turno tarde ────────────────────────────────────────
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes) VALUES
    (tid, emp4, svc4, 'Félix Carrasco',   'felix@test.es',      '655200027', '2026-06-02', '15:00', 'CONFIRMED', NOW(), 'Cadera derecha'),
    (tid, emp4, svc4, 'Milagros Rueda',   'milagros@test.es',   '655200028', '2026-06-02', '15:45', 'PENDING',   NOW(), NULL),
    (tid, emp4, svc1, 'Gustavo Ponce',    'gustavo@test.es',    '655200029', '2026-06-04', '16:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp4, svc4, 'Esperanza Nieto',  'esperanza@test.es',  '655200030', '2026-06-11', '15:00', 'CONFIRMED', NOW(), NULL),
    (tid, emp4, svc1, 'Isidro Gallardo',  'isidro@test.es',     '655200031', '2026-06-13', '15:00', 'PENDING',   NOW(), NULL),
    (tid, emp4, svc4, 'Florencia Rubio',  'florencia@test.es',  '655200032', '2026-06-18', '16:30', 'CONFIRMED', NOW(), 'Pie derecho');

  -- ── RESERVAS CON CAMPOS PERSONALIZADOS RELLENOS ───────────────────────────
  -- Masaje deportivo con "Zona a tratar" e "Intensidad deseada"
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes)
  VALUES (tid, emp1, svc1, 'Adriana Mora', 'adriana@test.es', '655200033', '2026-06-10', '09:00', 'CONFIRMED', NOW(), NULL)
  RETURNING id INTO bk_id;
  INSERT INTO booking_field_values (booking_id, custom_field_id, value)
  VALUES (bk_id, cf1, 'Espalda alta'), (bk_id, cf2, 'Suave');

  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes)
  VALUES (tid, emp3, svc1, 'Toni Bermejo', 'toni@test.es', '655200034', '2026-06-17', '10:00', 'PENDING', NOW(), NULL)
  RETURNING id INTO bk_id;
  INSERT INTO booking_field_values (booking_id, custom_field_id, value)
  VALUES (bk_id, cf1, 'Piernas y gemelos'), (bk_id, cf2, 'Fuerte');

  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes)
  VALUES (tid, emp4, svc1, 'Renata Fuentes', 'renata@test.es', '655200035', '2026-06-19', '15:00', 'CONFIRMED', NOW(), NULL)
  RETURNING id INTO bk_id;
  INSERT INTO booking_field_values (booking_id, custom_field_id, value)
  VALUES (bk_id, cf1, 'Cuello y hombros'), (bk_id, cf2, 'Media');

  -- Consulta inicial con "Motivo de la consulta"
  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes)
  VALUES (tid, emp1, svc2, 'Vanesa Cortés', 'vanesa@test.es', '655200036', '2026-06-10', '10:00', 'CONFIRMED', NOW(), NULL)
  RETURNING id INTO bk_id;
  INSERT INTO booking_field_values (booking_id, custom_field_id, value)
  VALUES (bk_id, cf3, 'Dolor cervical crónico desde hace 3 meses');

  INSERT INTO bookings (tenant_id, employee_id, service_id, customer_name, customer_email, customer_phone, date, start_time, status, created_at, notes)
  VALUES (tid, emp2, svc2, 'Marcos Pedraza', 'marcosP@test.es', '655200037', '2026-06-17', '10:00', 'PENDING', NOW(), NULL)
  RETURNING id INTO bk_id;
  INSERT INTO booking_field_values (booking_id, custom_field_id, value)
  VALUES (bk_id, cf3, 'Recuperación post-operatoria rodilla');

END $$;

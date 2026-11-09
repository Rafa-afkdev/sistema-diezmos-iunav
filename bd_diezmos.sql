-- ============================================================
-- Actividad G - Base de Datos en PostgreSQL
-- Sobre de Diezmos y Ofrendas - Modelo en 3FN
--
-- Para ejecutar:  psql -U postgres -f bd_diezmos.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. CREAR LA BASE DE DATOS
-- ------------------------------------------------------------

DROP DATABASE IF EXISTS bd_diezmos;

CREATE DATABASE bd_diezmos;

\c bd_diezmos


-- ------------------------------------------------------------
-- 2. CREAR LAS TABLAS
-- ------------------------------------------------------------

-- Tabla 1: iglesias
CREATE TABLE iglesia (
    id_iglesia     SERIAL PRIMARY KEY,
    nombre_iglesia VARCHAR(80) NOT NULL,
    ciudad         VARCHAR(50) NOT NULL,
    UNIQUE (nombre_iglesia, ciudad)
);

-- Tabla 2: feligreses
CREATE TABLE feligres (
    id_feligres SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL,
    apellido    VARCHAR(50) NOT NULL,
    email       VARCHAR(80) UNIQUE,
    id_iglesia  INTEGER NOT NULL REFERENCES iglesia (id_iglesia)
);

-- Tabla 3: encabezado del sobre
CREATE TABLE sobre (
    id_sobre    SERIAL PRIMARY KEY,
    nro_sobre   INTEGER NOT NULL CHECK (nro_sobre > 0),
    fecha       DATE NOT NULL,
    id_feligres INTEGER NOT NULL REFERENCES feligres (id_feligres)
);

-- El numero de sobre reinicia en 1 cada mes, por eso la unicidad
-- se define sobre el numero junto con el mes y el anio de la fecha.
CREATE UNIQUE INDEX uq_sobre_mes
    ON sobre (nro_sobre, EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha));

-- Tabla 4: lineas de aporte del sobre
CREATE TABLE detalle_aporte (
    id_sobre    INTEGER NOT NULL REFERENCES sobre (id_sobre) ON DELETE CASCADE,
    nro_linea   INTEGER NOT NULL,
    tipo_aporte VARCHAR(25) NOT NULL,
    concepto    VARCHAR(60),
    tipo_moneda VARCHAR(15) NOT NULL,
    monto       NUMERIC(12,2) NOT NULL,
    PRIMARY KEY (id_sobre, nro_linea),
    CHECK (monto > 0),
    CHECK (tipo_moneda IN ('Bs', 'USD')),
    CHECK (tipo_aporte IN ('Diezmo', 'Ofrenda de Pacto de Amor', 'Ofrenda de Colaboracion'))
);

-- Tabla 5: bancos
CREATE TABLE banco (
    id_banco     SERIAL PRIMARY KEY,
    nombre_banco VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla 6: cuentas que reciben las transferencias
CREATE TABLE cuenta_receptora (
    id_cuenta  SERIAL PRIMARY KEY,
    nro_cuenta VARCHAR(30) NOT NULL UNIQUE,
    id_banco   INTEGER NOT NULL REFERENCES banco (id_banco)
);

-- Tabla 7: transferencias que respaldan el sobre
CREATE TABLE transferencia (
    id_sobre            INTEGER NOT NULL REFERENCES sobre (id_sobre) ON DELETE CASCADE,
    nro_linea           INTEGER NOT NULL,
    fecha_transferencia DATE NOT NULL,
    nro_transferencia   VARCHAR(25) NOT NULL,
    id_cuenta           INTEGER NOT NULL REFERENCES cuenta_receptora (id_cuenta),
    monto_transferencia NUMERIC(12,2) NOT NULL,
    PRIMARY KEY (id_sobre, nro_linea),
    CHECK (monto_transferencia > 0)
);


-- ------------------------------------------------------------
-- 3. VISTAS PARA LOS REPORTES
-- ------------------------------------------------------------

-- Reporte semanal: se filtra por rango de fechas.
-- Ejemplo:
--   SELECT * FROM vista_reporte_semanal
--   WHERE fecha BETWEEN '2026-11-02' AND '2026-11-08';
CREATE VIEW vista_reporte_semanal AS
SELECT s.fecha,
       s.nro_sobre,
       f.nombre || ' ' || f.apellido AS nombre_apellido,
       SUM(d.monto) AS monto_total
FROM sobre s
JOIN feligres f ON f.id_feligres = s.id_feligres
JOIN detalle_aporte d ON d.id_sobre = s.id_sobre
GROUP BY s.id_sobre, s.fecha, s.nro_sobre, f.nombre, f.apellido;


-- Reporte mensual: se filtra por anio y mes.
-- Ejemplo:
--   SELECT * FROM vista_reporte_mensual WHERE anio = 2026 AND mes = 11;
CREATE VIEW vista_reporte_mensual AS
SELECT EXTRACT(YEAR FROM s.fecha) AS anio,
       EXTRACT(MONTH FROM s.fecha) AS mes,
       s.nro_sobre,
       f.nombre || ' ' || f.apellido AS nombre_apellido,
       SUM(CASE WHEN d.tipo_aporte = 'Diezmo' THEN d.monto ELSE 0 END) AS monto_diezmo,
       SUM(CASE WHEN d.tipo_aporte = 'Ofrenda de Pacto de Amor' THEN d.monto ELSE 0 END) AS monto_ofrenda_amor,
       SUM(CASE WHEN d.tipo_aporte = 'Ofrenda de Colaboracion' THEN d.monto ELSE 0 END) AS monto_otras_ofrendas,
       SUM(d.monto) AS total_sobre
FROM sobre s
JOIN feligres f ON f.id_feligres = s.id_feligres
JOIN detalle_aporte d ON d.id_sobre = s.id_sobre
GROUP BY s.id_sobre, s.fecha, s.nro_sobre, f.nombre, f.apellido;


-- ------------------------------------------------------------
-- 4. DATOS DE PRUEBA
-- ------------------------------------------------------------

INSERT INTO iglesia (nombre_iglesia, ciudad) VALUES
    ('Iglesia Central Nirgua', 'Nirgua'),
    ('Iglesia El Remanente', 'Nirgua'),
    ('Iglesia Monte Sinai', 'Chivacoa');

INSERT INTO banco (nombre_banco) VALUES
    ('Banco de Venezuela'),
    ('Banesco'),
    ('Banco Provincial');

INSERT INTO cuenta_receptora (nro_cuenta, id_banco) VALUES
    ('0102-0123-45-0000111222', 1),
    ('0134-0987-65-0000333444', 2),
    ('0108-0555-12-0000777888', 3);

INSERT INTO feligres (nombre, apellido, email, id_iglesia) VALUES
    ('Rafael', 'Castellano', 'rafael.castellano@correo.com', 1),
    ('Maria', 'Perez', 'maria.perez@correo.com', 1),
    ('Jose', 'Rodriguez', 'jose.rodriguez@correo.com', 2),
    ('Carmen', 'Gonzalez', 'carmen.gonzalez@correo.com', 2),
    ('Luis', 'Martinez', NULL, 3);

-- Sobres de octubre: el correlativo va del 1 al 3
INSERT INTO sobre (nro_sobre, fecha, id_feligres) VALUES
    (1, '2026-10-03', 1),
    (2, '2026-10-10', 2),
    (3, '2026-10-24', 3);

-- Sobres de noviembre: el correlativo reinicia en 1
INSERT INTO sobre (nro_sobre, fecha, id_feligres) VALUES
    (1, '2026-11-07', 1),
    (2, '2026-11-07', 4),
    (3, '2026-11-08', 2),
    (4, '2026-11-08', 5);

INSERT INTO detalle_aporte (id_sobre, nro_linea, tipo_aporte, concepto, tipo_moneda, monto) VALUES
    (1, 1, 'Diezmo', NULL, 'Bs', 450.00),
    (1, 2, 'Ofrenda de Pacto de Amor', NULL, 'Bs', 90.00),
    (2, 1, 'Diezmo', NULL, 'USD', 60.00),
    (2, 2, 'Ofrenda de Colaboracion', 'Construccion templo', 'USD', 15.00),
    (3, 1, 'Diezmo', NULL, 'Bs', 300.00),
    (4, 1, 'Diezmo', NULL, 'Bs', 520.00),
    (4, 2, 'Ofrenda de Pacto de Amor', NULL, 'Bs', 104.00),
    (4, 3, 'Ofrenda de Colaboracion', 'Conquistadores', 'Bs', 50.00),
    (5, 1, 'Diezmo', NULL, 'USD', 80.00),
    (5, 2, 'Ofrenda de Pacto de Amor', NULL, 'USD', 16.00),
    (6, 1, 'Diezmo', NULL, 'Bs', 615.50),
    (6, 2, 'Ofrenda de Colaboracion', 'Ayuda social', 'Bs', 75.00),
    (6, 3, 'Ofrenda de Colaboracion', 'Departamento musica', 'Bs', 40.00),
    (7, 1, 'Diezmo', NULL, 'Bs', 280.00);

INSERT INTO transferencia (id_sobre, nro_linea, fecha_transferencia, nro_transferencia, id_cuenta, monto_transferencia) VALUES
    (1, 1, '2026-10-03', '000123456789', 1, 540.00),
    (4, 1, '2026-11-07', '000987654321', 1, 400.00),
    (4, 2, '2026-11-07', '000987654322', 2, 274.00),
    (6, 1, '2026-11-08', '000555666777', 3, 730.50);


-- ------------------------------------------------------------
-- 5. CONSULTAS DE PRUEBA
-- ------------------------------------------------------------

-- Cantidad de registros cargados
SELECT 'iglesia' AS tabla, COUNT(*) AS registros FROM iglesia
UNION ALL SELECT 'feligres', COUNT(*) FROM feligres
UNION ALL SELECT 'sobre', COUNT(*) FROM sobre
UNION ALL SELECT 'detalle_aporte', COUNT(*) FROM detalle_aporte
UNION ALL SELECT 'banco', COUNT(*) FROM banco
UNION ALL SELECT 'cuenta_receptora', COUNT(*) FROM cuenta_receptora
UNION ALL SELECT 'transferencia', COUNT(*) FROM transferencia;

-- Reporte semanal del 02 al 08 de noviembre
SELECT nro_sobre, nombre_apellido, monto_total
FROM vista_reporte_semanal
WHERE fecha BETWEEN '2026-11-02' AND '2026-11-08'
ORDER BY nro_sobre;

-- Reporte mensual de noviembre
SELECT nro_sobre, nombre_apellido, monto_diezmo, monto_ofrenda_amor,
       monto_otras_ofrendas, total_sobre
FROM vista_reporte_mensual
WHERE anio = 2026 AND mes = 11
ORDER BY nro_sobre;

-- Totales al pie del reporte mensual
SELECT SUM(monto_diezmo) AS total_diezmo,
       SUM(monto_ofrenda_amor) AS total_ofrenda_amor,
       SUM(monto_otras_ofrendas) AS total_otras_ofrendas,
       SUM(total_sobre) AS total_general
FROM vista_reporte_mensual
WHERE anio = 2026 AND mes = 11;

-- Siguiente numero de sobre del mes (lo usa la aplicacion al registrar)
SELECT COALESCE(MAX(nro_sobre), 0) + 1 AS siguiente_nro_sobre
FROM sobre
WHERE EXTRACT(YEAR FROM fecha) = 2026
  AND EXTRACT(MONTH FROM fecha) = 11;

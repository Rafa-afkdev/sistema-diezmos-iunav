# Sistema de Sobres de Diezmos y Ofrendas

Aplicación web para registrar los sobres de diezmos y ofrendas de la iglesia y emitir
los reportes semanal y mensual.

Actividad H de la asignatura **Modelo de Datos** — Instituto Universitario Adventista
de Venezuela.

Construida con **Next.js 15** y **PostgreSQL**.

---

## Qué hace

- **Registrar sobres.** Se cargan N sobres por fecha. El número de sobre se asigna
  solo y reinicia en 1 cada mes. Tras guardar, el formulario queda listo para el
  siguiente sobre con el número ya actualizado.
- **Feligreses.** Alta y consulta de las personas que entregan los sobres.
- **Reporte semanal.** Número de sobre, nombre y apellido, y monto total, filtrado
  por rango de fechas.
- **Reporte mensual.** Número de sobre, nombre y apellido, monto de diezmo, ofrenda
  de pacto de amor, otras ofrendas y total del sobre, con los totales de cada
  columna al pie.
- **Exportación a PDF** de ambos reportes.
- **Pantalla de conexión**: los datos de PostgreSQL se piden al iniciar, así que la
  aplicación corre en cualquier equipo sin tocar el código.

---

## Instalación

### 1. Crear la base de datos

Necesitas PostgreSQL instalado. Desde la carpeta del proyecto:

```bash
psql -U postgres -f bd_diezmos.sql
```

Eso crea la base `bd_diezmos` con las 7 tablas del modelo en 3FN, las vistas de
reportes y datos de prueba.

### 2. Instalar las dependencias

```bash
npm install
```

### 3. Levantar la aplicación

```bash
npm run dev
```

Abre http://localhost:3000

### 4. Conectar

En la primera pantalla indica los datos de tu PostgreSQL:

| Campo         | Valor habitual |
| ------------- | -------------- |
| Servidor      | localhost      |
| Puerto        | 5432           |
| Base de datos | bd_diezmos     |
| Usuario       | postgres       |
| Contraseña    | la tuya        |

---

## Estructura del proyecto

```
app/
  page.js                     Pantalla de conexión
  panel/page.js               Panel principal
  sobres/page.js              Listado de sobres
  sobres/nuevo/page.js        Formulario de registro
  feligreses/page.js          Alta y listado de feligreses
  reportes/semanal/page.js    Reporte semanal
  reportes/mensual/page.js    Reporte mensual
  api/
    conexion/                 Prueba y guarda la conexión
    catalogos/                Feligreses, iglesias y cuentas
    feligreses/               Consulta y alta
    sobres/                   Consulta y registro completo
    sobres/siguiente/         Número correlativo del mes
    reportes/semanal/         Datos del reporte semanal
    reportes/mensual/         Datos del reporte mensual
lib/
  db.js                       Conexión a PostgreSQL
  formato.js                  Formato de montos y fechas
  pdf.js                      Generación de los PDF
components/
  Encabezado.js               Barra superior y menú
  Marco.js                    Envoltura común de las pantallas
bd_diezmos.sql                Script de la base de datos
```

---

## Decisiones técnicas

**El número de sobre.** Se calcula dentro de la misma transacción que inserta el
sobre, tomando el máximo del mes más uno. La base tiene un índice único sobre
`(nro_sobre, año y mes de fecha)` que impide duplicados; si dos usuarios graban a la
vez, el segundo recibe el error y la aplicación reintenta con el número siguiente.

**El total del sobre no se guarda.** Es un valor derivado, así que se calcula sumando
los montos de `detalle_aporte`. Por eso el campo "Total Incluido" del sobre original
se eliminó al aplicar la 1FN.

**Los reportes usan vistas.** `vista_reporte_semanal` y `vista_reporte_mensual` están
definidas en `bd_diezmos.sql`, de modo que la lógica de los montos por tipo de aporte
vive en la base y no en la aplicación.

**Transacciones.** Al guardar un sobre, el encabezado, los aportes y las
transferencias se insertan en una sola transacción. Si algo falla, no queda un sobre
a medias.

**La conexión se guarda en una cookie** `httpOnly` con 8 horas de vigencia, no en el
código ni en variables de entorno.

---

## Despliegue

El proyecto está pensado para correr en local contra tu PostgreSQL. Si más adelante
quieres publicarlo en Vercel, la aplicación funciona igual, pero la base de datos
debe estar accesible desde internet: Vercel no puede alcanzar un PostgreSQL instalado
en tu PC. En ese caso crea la base en Neon o Supabase, ejecuta allí el contenido de
`bd_diezmos.sql` sin las líneas `DROP DATABASE`, `CREATE DATABASE` ni `\c`, y pega
esos datos en la pantalla de conexión marcando el servidor correspondiente.

import { NextResponse } from "next/server";
import { consultar, enTransaccion } from "@/lib/db";

// Lista de sobres con su total.
export async function GET(peticion) {
  const parametros = new URL(peticion.url).searchParams;
  const fecha = parametros.get("fecha");

  try {
    let sql = `SELECT s.id_sobre, s.nro_sobre, s.fecha,
                      f.nombre || ' ' || f.apellido AS nombre_apellido,
                      COALESCE(SUM(d.monto), 0) AS total_sobre,
                      COUNT(d.nro_linea) AS lineas
                 FROM sobre s
                 JOIN feligres f ON f.id_feligres = s.id_feligres
                 LEFT JOIN detalle_aporte d ON d.id_sobre = s.id_sobre`;
    const valores = [];

    if (fecha) {
      sql += " WHERE s.fecha = $1::date";
      valores.push(fecha);
    }

    sql += ` GROUP BY s.id_sobre, s.nro_sobre, s.fecha, f.nombre, f.apellido
             ORDER BY s.fecha DESC, s.nro_sobre DESC
             LIMIT 100`;

    return NextResponse.json(await consultar(sql, valores));
  } catch (error) {
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

// Registra un sobre completo: encabezado, aportes y transferencias.
export async function POST(peticion) {
  const datos = await peticion.json();

  const problema = validar(datos);
  if (problema) return NextResponse.json({ error: problema }, { status: 400 });

  // Si dos personas graban al mismo tiempo, el indice unico de la base
  // rechaza el numero repetido. En ese caso se reintenta con el siguiente.
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const resultado = await guardarSobre(datos);
      return NextResponse.json(resultado);
    } catch (error) {
      if (error.code === "23505" && intento < 3) continue;
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "No se pudo asignar el numero de sobre. Intenta de nuevo." },
          { status: 409 }
        );
      }
      if (error.code === "23514") {
        return NextResponse.json(
          { error: "Un dato no cumple las reglas de la base: revisa montos, moneda y tipo de aporte." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: String(error.message) }, { status: 500 });
    }
  }
}

async function guardarSobre(datos) {
  return enTransaccion(async (cliente) => {
    // 1. Numero correlativo del mes
    const siguiente = await cliente.query(
      `SELECT COALESCE(MAX(nro_sobre), 0) + 1 AS n
         FROM sobre
        WHERE EXTRACT(YEAR  FROM fecha) = EXTRACT(YEAR  FROM $1::date)
          AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM $1::date)`,
      [datos.fecha]
    );
    const nroSobre = Number(siguiente.rows[0].n);

    // 2. Encabezado
    const sobre = await cliente.query(
      `INSERT INTO sobre (nro_sobre, fecha, id_feligres)
       VALUES ($1, $2, $3) RETURNING id_sobre`,
      [nroSobre, datos.fecha, datos.id_feligres]
    );
    const idSobre = sobre.rows[0].id_sobre;

    // 3. Lineas de aporte
    let linea = 1;
    for (const aporte of datos.aportes) {
      await cliente.query(
        `INSERT INTO detalle_aporte
           (id_sobre, nro_linea, tipo_aporte, concepto, tipo_moneda, monto)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          idSobre,
          linea,
          aporte.tipo_aporte,
          aporte.tipo_aporte === "Ofrenda de Colaboracion" ? aporte.concepto : null,
          aporte.tipo_moneda,
          aporte.monto,
        ]
      );
      linea++;
    }

    // 4. Transferencias (opcionales)
    let lineaTransferencia = 1;
    for (const transferencia of datos.transferencias || []) {
      await cliente.query(
        `INSERT INTO transferencia
           (id_sobre, nro_linea, fecha_transferencia, nro_transferencia,
            id_cuenta, monto_transferencia)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          idSobre,
          lineaTransferencia,
          transferencia.fecha_transferencia,
          transferencia.nro_transferencia,
          transferencia.id_cuenta,
          transferencia.monto_transferencia,
        ]
      );
      lineaTransferencia++;
    }

    return { id_sobre: idSobre, nro_sobre: nroSobre };
  });
}

function validar(datos) {
  if (!datos.fecha) return "Debes indicar la fecha del sobre.";
  if (!datos.id_feligres) return "Debes seleccionar el feligres.";
  if (!Array.isArray(datos.aportes) || datos.aportes.length === 0)
    return "El sobre debe tener al menos una linea de aporte.";

  for (const aporte of datos.aportes) {
    if (!aporte.tipo_aporte) return "Falta el tipo en una de las lineas.";
    if (!(Number(aporte.monto) > 0))
      return "Todos los montos deben ser mayores que cero.";
    if (aporte.tipo_aporte === "Ofrenda de Colaboracion" && !aporte.concepto?.trim())
      return "Las ofrendas de colaboracion necesitan un concepto.";
  }

  for (const t of datos.transferencias || []) {
    if (!t.fecha_transferencia || !t.nro_transferencia || !t.id_cuenta)
      return "Completa todos los datos de la transferencia o eliminala.";
    if (!(Number(t.monto_transferencia) > 0))
      return "El monto de la transferencia debe ser mayor que cero.";
  }

  return null;
}

import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";

// Reporte semanal: usa la vista creada en bd_diezmos.sql
export async function GET(peticion) {
  const p = new URL(peticion.url).searchParams;
  const desde = p.get("desde");
  const hasta = p.get("hasta");

  if (!desde || !hasta) {
    return NextResponse.json({ error: "Indica el rango de fechas." }, { status: 400 });
  }

  try {
    const filas = await consultar(
      `SELECT fecha, nro_sobre, nombre_apellido, monto_total
         FROM vista_reporte_semanal
        WHERE fecha BETWEEN $1::date AND $2::date
        ORDER BY fecha, nro_sobre`,
      [desde, hasta]
    );

    const total = filas.reduce((suma, f) => suma + Number(f.monto_total), 0);
    return NextResponse.json({ filas, total });
  } catch (error) {
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

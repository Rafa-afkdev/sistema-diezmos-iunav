import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";

// Reporte mensual: usa la vista creada en bd_diezmos.sql
export async function GET(peticion) {
  const p = new URL(peticion.url).searchParams;
  const anio = p.get("anio");
  const mes = p.get("mes");

  if (!anio || !mes) {
    return NextResponse.json({ error: "Indica el anio y el mes." }, { status: 400 });
  }

  try {
    const filas = await consultar(
      `SELECT nro_sobre, nombre_apellido, monto_diezmo, monto_ofrenda_amor,
              monto_otras_ofrendas, total_sobre
         FROM vista_reporte_mensual
        WHERE anio = $1::int AND mes = $2::int
        ORDER BY nro_sobre`,
      [anio, mes]
    );

    // Totales de cada columna, para el pie del reporte.
    const totales = {
      diezmo: sumar(filas, "monto_diezmo"),
      ofrenda_amor: sumar(filas, "monto_ofrenda_amor"),
      otras_ofrendas: sumar(filas, "monto_otras_ofrendas"),
      general: sumar(filas, "total_sobre"),
    };

    return NextResponse.json({ filas, totales });
  } catch (error) {
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

function sumar(filas, campo) {
  return filas.reduce((suma, f) => suma + Number(f[campo]), 0);
}

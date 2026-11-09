import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";

// Numero que le toca al proximo sobre del mes de esa fecha.
export async function GET(peticion) {
  const fecha = new URL(peticion.url).searchParams.get("fecha");
  if (!fecha) {
    return NextResponse.json({ error: "Falta la fecha." }, { status: 400 });
  }
  try {
    const filas = await consultar(
      `SELECT COALESCE(MAX(nro_sobre), 0) + 1 AS siguiente
         FROM sobre
        WHERE EXTRACT(YEAR  FROM fecha) = EXTRACT(YEAR  FROM $1::date)
          AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM $1::date)`,
      [fecha]
    );
    return NextResponse.json({ siguiente: Number(filas[0].siguiente) });
  } catch (error) {
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

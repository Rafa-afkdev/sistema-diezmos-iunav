import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";

// Devuelve en una sola llamada lo que necesitan los formularios.
export async function GET() {
  try {
    const feligreses = await consultar(
      `SELECT f.id_feligres, f.nombre, f.apellido, i.nombre_iglesia
         FROM feligres f
         JOIN iglesia i ON i.id_iglesia = f.id_iglesia
        ORDER BY f.apellido, f.nombre`
    );
    const iglesias = await consultar(
      "SELECT id_iglesia, nombre_iglesia, ciudad FROM iglesia ORDER BY nombre_iglesia"
    );
    const cuentas = await consultar(
      `SELECT c.id_cuenta, c.nro_cuenta, b.nombre_banco
         FROM cuenta_receptora c
         JOIN banco b ON b.id_banco = c.id_banco
        ORDER BY b.nombre_banco`
    );
    return NextResponse.json({ feligreses, iglesias, cuentas });
  } catch (error) {
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

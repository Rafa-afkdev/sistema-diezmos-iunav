import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";

export async function GET() {
  try {
    const filas = await consultar(
      `SELECT f.id_feligres, f.nombre, f.apellido, f.email,
              i.nombre_iglesia, i.ciudad
         FROM feligres f
         JOIN iglesia i ON i.id_iglesia = f.id_iglesia
        ORDER BY f.apellido, f.nombre`
    );
    return NextResponse.json(filas);
  } catch (error) {
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

export async function POST(peticion) {
  const datos = await peticion.json();

  if (!datos.nombre || !datos.apellido || !datos.id_iglesia) {
    return NextResponse.json(
      { error: "Nombre, apellido e iglesia son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const filas = await consultar(
      `INSERT INTO feligres (nombre, apellido, email, id_iglesia)
       VALUES ($1, $2, $3, $4)
       RETURNING id_feligres`,
      [datos.nombre.trim(), datos.apellido.trim(), datos.email?.trim() || null, datos.id_iglesia]
    );
    return NextResponse.json({ id_feligres: filas[0].id_feligres });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ese correo ya esta registrado para otro feligres." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

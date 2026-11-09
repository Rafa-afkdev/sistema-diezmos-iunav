import { NextResponse } from "next/server";
import { crearCliente, guardarConexion, borrarConexion, leerConexion } from "@/lib/db";

// Prueba los datos y, si funcionan, los guarda.
export async function POST(peticion) {
  const datos = await peticion.json();

  if (!datos.host || !datos.database || !datos.user) {
    return NextResponse.json(
      { error: "Faltan datos: servidor, base de datos y usuario son obligatorios." },
      { status: 400 }
    );
  }

  const cliente = crearCliente(datos);
  try {
    await cliente.connect();
    // Verifica que la base tenga las tablas del modelo.
    const r = await cliente.query(
      "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sobre','feligres','detalle_aporte')"
    );
    if (Number(r.rows[0].n) < 3) {
      return NextResponse.json(
        { error: "Conecto, pero la base no tiene las tablas del modelo. Ejecuta primero bd_diezmos.sql." },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: traducirError(error) }, { status: 400 });
  } finally {
    await cliente.end().catch(() => {});
  }

  await guardarConexion(datos);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const datos = await leerConexion();
  if (!datos) return NextResponse.json({ conectado: false });
  return NextResponse.json({
    conectado: true,
    host: datos.host,
    database: datos.database,
    user: datos.user,
  });
}

export async function DELETE() {
  await borrarConexion();
  return NextResponse.json({ ok: true });
}

function traducirError(error) {
  const texto = String(error.message || error);
  if (texto.includes("ECONNREFUSED"))
    return "No se pudo conectar. Revisa que PostgreSQL este encendido y el puerto sea correcto.";
  if (texto.includes("password") || texto.includes("autenticacion") || texto.includes("authentication"))
    return "Usuario o contrasena incorrectos.";
  if (texto.includes("does not exist"))
    return "La base de datos no existe. Ejecuta bd_diezmos.sql primero.";
  return texto;
}

import { cookies } from "next/headers";
import { Client } from "pg";

const COOKIE = "conexion_bd";

// Guarda los datos de conexion en una cookie del navegador.
// Asi la aplicacion funciona en cualquier PC sin tocar el codigo.
export async function guardarConexion(datos) {
  const galletas = await cookies();
  galletas.set(COOKIE, JSON.stringify(datos), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

export async function borrarConexion() {
  const galletas = await cookies();
  galletas.delete(COOKIE);
}

export async function leerConexion() {
  const galletas = await cookies();
  const valor = galletas.get(COOKIE)?.value;
  if (!valor) return null;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

export async function hayConexion() {
  return (await leerConexion()) !== null;
}

// Abre un cliente de PostgreSQL con los datos guardados.
export async function abrirCliente() {
  const datos = await leerConexion();
  if (!datos) throw new Error("No hay una conexion configurada.");
  return crearCliente(datos);
}

export function crearCliente(datos) {
  return new Client({
    host: datos.host,
    port: Number(datos.port),
    database: datos.database,
    user: datos.user,
    password: datos.password,
    ssl: datos.ssl ? { rejectUnauthorized: false } : false,
  });
}

// Ejecuta una consulta abriendo y cerrando la conexion.
export async function consultar(sql, parametros = []) {
  const cliente = await abrirCliente();
  await cliente.connect();
  try {
    const resultado = await cliente.query(sql, parametros);
    return resultado.rows;
  } finally {
    await cliente.end();
  }
}

// Ejecuta varias operaciones dentro de una transaccion.
export async function enTransaccion(trabajo) {
  const cliente = await abrirCliente();
  await cliente.connect();
  try {
    await cliente.query("BEGIN");
    const salida = await trabajo(cliente);
    await cliente.query("COMMIT");
    return salida;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    await cliente.end();
  }
}

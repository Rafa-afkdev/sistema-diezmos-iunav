"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PantallaConexion() {
  const router = useRouter();
  const [datos, setDatos] = useState({
    host: "localhost",
    port: "5432",
    database: "bd_diezmos",
    user: "postgres",
    password: "",
    ssl: false,
  });
  const [error, setError] = useState("");
  const [conectando, setConectando] = useState(false);

  // Si ya hay una conexion activa, entra directo al panel.
  useEffect(() => {
    fetch("/api/conexion")
      .then((r) => r.json())
      .then((d) => d.conectado && router.replace("/panel"))
      .catch(() => {});
  }, [router]);

  function cambiar(campo, valor) {
    setDatos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function conectar(evento) {
    evento.preventDefault();
    setError("");
    setConectando(true);

    try {
      const respuesta = await fetch("/api/conexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setError(cuerpo.error);
        setConectando(false);
        return;
      }

      router.push("/panel");
    } catch {
      setError("No se pudo contactar al servidor de la aplicacion.");
      setConectando(false);
    }
  }

  return (
    <main className="pantalla-conexion">
      <form className="caja-conexion" onSubmit={conectar}>
        <h1>Conectar con la base de datos</h1>
        <p>Indica donde esta corriendo PostgreSQL con la base bd_diezmos.</p>

        {error && <div className="mensaje mensaje-error">{error}</div>}

        <div className="rejilla dos">
          <div className="campo">
            <label htmlFor="host">Servidor</label>
            <input
              id="host"
              value={datos.host}
              onChange={(e) => cambiar("host", e.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="port">Puerto</label>
            <input
              id="port"
              value={datos.port}
              onChange={(e) => cambiar("port", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="database">Base de datos</label>
          <input
            id="database"
            value={datos.database}
            onChange={(e) => cambiar("database", e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="user">Usuario</label>
          <input
            id="user"
            value={datos.user}
            onChange={(e) => cambiar("user", e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            value={datos.password}
            onChange={(e) => cambiar("password", e.target.value)}
          />
        </div>

        <button type="submit" className="boton-principal" disabled={conectando} style={{ width: "100%" }}>
          {conectando ? "Conectando..." : "Conectar"}
        </button>

        <p className="pequeno suave" style={{ marginTop: "1.2rem", marginBottom: 0 }}>
          Si la base aun no existe, ejecuta primero el archivo bd_diezmos.sql.
        </p>
      </form>
    </main>
  );
}

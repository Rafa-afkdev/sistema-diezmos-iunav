"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Encabezado from "./Encabezado";

// Envoltura comun de las pantallas internas.
// Si no hay conexion guardada, devuelve al usuario a la pantalla inicial.
export default function Marco({ titulo, descripcion, acciones, children }) {
  const router = useRouter();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    fetch("/api/conexion")
      .then((r) => r.json())
      .then((d) => (d.conectado ? setVerificado(true) : router.replace("/")))
      .catch(() => router.replace("/"));
  }, [router]);

  if (!verificado) {
    return (
      <main className="contenido">
        <p className="suave">Verificando la conexion...</p>
      </main>
    );
  }

  return (
    <>
      <Encabezado />
      <main className="contenido">
        <div className="cabecera-pagina fila-botones" style={{ justifyContent: "space-between" }}>
          <div>
            <h1>{titulo}</h1>
            {descripcion && <p>{descripcion}</p>}
          </div>
          {acciones}
        </div>
        {children}
      </main>
    </>
  );
}

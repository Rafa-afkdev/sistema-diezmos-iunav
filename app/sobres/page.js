"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Marco from "@/components/Marco";
import { bolivares, fechaCorta } from "@/lib/formato";

export default function ListaSobres() {
  const [sobres, setSobres] = useState([]);
  const [fecha, setFecha] = useState("");
  const [cargando, setCargando] = useState(true);

  function cargar(filtroFecha = "") {
    setCargando(true);
    const url = filtroFecha ? `/api/sobres?fecha=${filtroFecha}` : "/api/sobres";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setSobres(Array.isArray(d) ? d : []))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, []);

  return (
    <Marco
      titulo="Sobres registrados"
      descripcion="Ultimos 100 sobres cargados. Filtra por fecha para ver los de un dia."
      acciones={
        <Link href="/sobres/nuevo" className="boton boton-principal">
          Registrar sobre
        </Link>
      }
    >
      <div className="tarjeta" style={{ marginBottom: "1.25rem" }}>
        <div className="fila-botones">
          <div style={{ minWidth: "200px" }}>
            <label htmlFor="filtro">Fecha</label>
            <input
              id="filtro"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <button className="boton-principal" onClick={() => cargar(fecha)}>
            Buscar
          </button>
          <button
            className="boton-secundario"
            onClick={() => {
              setFecha("");
              cargar();
            }}
          >
            Ver todos
          </button>
        </div>
      </div>

      <div className="tabla-envoltura">
        {cargando ? (
          <p className="vacio">Cargando...</p>
        ) : sobres.length === 0 ? (
          <p className="vacio">
            No hay sobres para mostrar. Registra el primero desde el boton de arriba.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>N.o sobre</th>
                <th>Fecha</th>
                <th>Feligres</th>
                <th className="numero">Renglones</th>
                <th className="numero">Total</th>
              </tr>
            </thead>
            <tbody>
              {sobres.map((s) => (
                <tr key={s.id_sobre}>
                  <td>{s.nro_sobre}</td>
                  <td>{fechaCorta(s.fecha)}</td>
                  <td>{s.nombre_apellido}</td>
                  <td className="numero">{s.lineas}</td>
                  <td className="numero">{bolivares(s.total_sobre)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Marco>
  );
}

"use client";

import { useState } from "react";
import Marco from "@/components/Marco";
import { bolivares, MESES } from "@/lib/formato";
import { generarPdf } from "@/lib/pdf";

export default function ReporteMensual() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function consultar(evento) {
    evento?.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/reportes/mensual?anio=${anio}&mes=${mes}`);
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) {
        setError(cuerpo.error);
        setDatos(null);
        return;
      }
      setDatos(cuerpo);
    } catch {
      setError("No se pudo generar el reporte.");
    } finally {
      setCargando(false);
    }
  }

  function exportar() {
    generarPdf({
      titulo: "Reporte mensual de sobres",
      subtitulo: `${MESES[mes - 1]} de ${anio}`,
      columnas: [
        "N.o sobre",
        "Nombre y apellido",
        "Monto diezmo",
        "Monto ofrenda de amor",
        "Monto otras ofrendas",
        "Total sobre",
      ],
      filas: datos.filas.map((f) => [
        f.nro_sobre,
        f.nombre_apellido,
        bolivares(f.monto_diezmo),
        bolivares(f.monto_ofrenda_amor),
        bolivares(f.monto_otras_ofrendas),
        bolivares(f.total_sobre),
      ]),
      totales: [
        "",
        "TOTALES",
        bolivares(datos.totales.diezmo),
        bolivares(datos.totales.ofrenda_amor),
        bolivares(datos.totales.otras_ofrendas),
        bolivares(datos.totales.general),
      ],
      archivo: `reporte-mensual-${anio}-${String(mes).padStart(2, "0")}.pdf`,
    });
  }

  return (
    <Marco
      titulo="Reporte mensual"
      descripcion="Sobres del mes con los montos separados por tipo de aporte y los totales de cada columna."
    >
      {error && <div className="mensaje mensaje-error">{error}</div>}

      <form className="tarjeta" style={{ marginBottom: "1.25rem" }} onSubmit={consultar}>
        <div className="fila-botones">
          <div style={{ minWidth: "160px" }}>
            <label htmlFor="mes">Mes</label>
            <select id="mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((nombre, i) => (
                <option key={nombre} value={i + 1}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: "110px" }}>
            <label htmlFor="anio">Anio</label>
            <input
              id="anio"
              type="number"
              value={anio}
              min="2000"
              max="2100"
              onChange={(e) => setAnio(Number(e.target.value))}
            />
          </div>
          <button type="submit" className="boton-principal" disabled={cargando}>
            {cargando ? "Generando..." : "Generar reporte"}
          </button>
          {datos && datos.filas.length > 0 && (
            <button type="button" className="boton-sello" onClick={exportar}>
              Descargar PDF
            </button>
          )}
        </div>
      </form>

      {datos && (
        <div className="tabla-envoltura">
          {datos.filas.length === 0 ? (
            <p className="vacio">
              No hay sobres registrados en {MESES[mes - 1]} de {anio}.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>N.o sobre</th>
                  <th>Nombre y apellido</th>
                  <th className="numero">Monto diezmo</th>
                  <th className="numero">Ofrenda de amor</th>
                  <th className="numero">Otras ofrendas</th>
                  <th className="numero">Total sobre</th>
                </tr>
              </thead>
              <tbody>
                {datos.filas.map((f, i) => (
                  <tr key={i}>
                    <td>{f.nro_sobre}</td>
                    <td>{f.nombre_apellido}</td>
                    <td className="numero">{bolivares(f.monto_diezmo)}</td>
                    <td className="numero">{bolivares(f.monto_ofrenda_amor)}</td>
                    <td className="numero">{bolivares(f.monto_otras_ofrendas)}</td>
                    <td className="numero">{bolivares(f.total_sobre)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>TOTALES ({datos.filas.length} sobres)</td>
                  <td className="numero">{bolivares(datos.totales.diezmo)}</td>
                  <td className="numero">{bolivares(datos.totales.ofrenda_amor)}</td>
                  <td className="numero">{bolivares(datos.totales.otras_ofrendas)}</td>
                  <td className="numero">{bolivares(datos.totales.general)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </Marco>
  );
}

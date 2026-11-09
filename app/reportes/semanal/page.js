"use client";

import { useState } from "react";
import Marco from "@/components/Marco";
import { bolivares, fechaCorta } from "@/lib/formato";
import { generarPdf } from "@/lib/pdf";

// Lunes y domingo de la semana en curso.
function semanaActual() {
  const hoy = new Date();
  const dia = hoy.getDay() === 0 ? 7 : hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dia + 1);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { desde: aTexto(lunes), hasta: aTexto(domingo) };
}

function aTexto(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export default function ReporteSemanal() {
  const inicial = semanaActual();
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function consultar(evento) {
    evento?.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/reportes/semanal?desde=${desde}&hasta=${hasta}`);
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
      titulo: "Reporte semanal de sobres",
      subtitulo: `Del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`,
      columnas: ["N.o sobre", "Fecha", "Nombre y apellido", "Monto total"],
      filas: datos.filas.map((f) => [
        f.nro_sobre,
        fechaCorta(f.fecha),
        f.nombre_apellido,
        bolivares(f.monto_total),
      ]),
      totales: ["", "", "TOTAL", bolivares(datos.total)],
      archivo: `reporte-semanal-${desde}-a-${hasta}.pdf`,
    });
  }

  return (
    <Marco
      titulo="Reporte semanal"
      descripcion="Sobres ingresados en un rango de fechas, con el monto total de cada uno."
    >
      {error && <div className="mensaje mensaje-error">{error}</div>}

      <form className="tarjeta" style={{ marginBottom: "1.25rem" }} onSubmit={consultar}>
        <div className="fila-botones">
          <div>
            <label htmlFor="desde">Desde</label>
            <input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="hasta">Hasta</label>
            <input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
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
            <p className="vacio">No hay sobres registrados en esas fechas.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>N.o sobre</th>
                  <th>Fecha</th>
                  <th>Nombre y apellido</th>
                  <th className="numero">Monto total</th>
                </tr>
              </thead>
              <tbody>
                {datos.filas.map((f, i) => (
                  <tr key={i}>
                    <td>{f.nro_sobre}</td>
                    <td>{fechaCorta(f.fecha)}</td>
                    <td>{f.nombre_apellido}</td>
                    <td className="numero">{bolivares(f.monto_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Total de la semana ({datos.filas.length} sobres)</td>
                  <td className="numero">{bolivares(datos.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </Marco>
  );
}

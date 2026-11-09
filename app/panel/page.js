"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Marco from "@/components/Marco";
import { bolivares } from "@/lib/formato";

const ACCESOS = [
  {
    ruta: "/sobres/nuevo",
    titulo: "Registrar sobre",
    texto: "Carga un sobre nuevo. El numero del mes se asigna solo.",
  },
  {
    ruta: "/sobres",
    titulo: "Sobres registrados",
    texto: "Revisa los ultimos sobres cargados y busca por fecha.",
  },
  {
    ruta: "/feligreses",
    titulo: "Feligreses",
    texto: "Consulta y agrega las personas que entregan sobres.",
  },
  {
    ruta: "/reportes/semanal",
    titulo: "Reporte semanal",
    texto: "Sobres de una semana con su monto total.",
  },
  {
    ruta: "/reportes/mensual",
    titulo: "Reporte mensual",
    texto: "Diezmos, ofrendas y totales de cada mes.",
  },
];

export default function Panel() {
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;

    fetch(`/api/reportes/mensual?anio=${anio}&mes=${mes}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.filas) {
          setResumen({
            mes: hoy.toLocaleDateString("es-VE", { month: "long", year: "numeric" }),
            sobres: d.filas.length,
            total: d.totales.general,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Marco
      titulo="Panel principal"
      descripcion="Registro de sobres de diezmos y ofrendas de la iglesia."
    >
      {resumen && (
        <div className="resumen">
          <div>
            <span>Mes en curso</span>
            <strong style={{ textTransform: "capitalize" }}>{resumen.mes}</strong>
          </div>
          <div>
            <span>Sobres del mes</span>
            <strong>{resumen.sobres}</strong>
          </div>
          <div>
            <span>Monto acumulado</span>
            <strong>{bolivares(resumen.total)}</strong>
          </div>
        </div>
      )}

      <div className="accesos">
        {ACCESOS.map((a) => (
          <Link key={a.ruta} href={a.ruta} className="acceso">
            <h3>{a.titulo}</h3>
            <p>{a.texto}</p>
          </Link>
        ))}
      </div>
    </Marco>
  );
}

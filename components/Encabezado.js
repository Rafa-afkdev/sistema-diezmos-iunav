"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PAGINAS = [
  { ruta: "/panel", texto: "Panel" },
  { ruta: "/sobres/nuevo", texto: "Registrar sobre" },
  { ruta: "/sobres", texto: "Sobres" },
  { ruta: "/feligreses", texto: "Feligreses" },
  { ruta: "/reportes/semanal", texto: "Reporte semanal" },
  { ruta: "/reportes/mensual", texto: "Reporte mensual" },
];

export default function Encabezado() {
  const ruta = usePathname();
  const router = useRouter();
  const [bd, setBd] = useState(null);

  useEffect(() => {
    fetch("/api/conexion")
      .then((r) => r.json())
      .then((d) => d.conectado && setBd(d))
      .catch(() => {});
  }, []);

  async function desconectar() {
    await fetch("/api/conexion", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="barra">
      <div className="barra-interior">
        <Link href="/panel" className="barra-titulo">
          Sobres de Diezmos y Ofrendas
          <span>Iglesia Adventista del Septimo Dia</span>
        </Link>

        <nav className="menu">
          {PAGINAS.map((p) => (
            <Link key={p.ruta} href={p.ruta} className={ruta === p.ruta ? "activo" : ""}>
              {p.texto}
            </Link>
          ))}
        </nav>

        {bd && (
          <div className="estado-bd">
            <span>
              {bd.database} en {bd.host}
            </span>
            <button onClick={desconectar}>Desconectar</button>
          </div>
        )}
      </div>
    </header>
  );
}

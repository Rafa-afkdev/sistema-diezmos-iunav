"use client";

import { useCallback, useEffect, useState } from "react";
import Marco from "@/components/Marco";
import { bolivares, hoyTexto } from "@/lib/formato";

const TIPOS = ["Diezmo", "Ofrenda de Pacto de Amor", "Ofrenda de Colaboracion"];
const MONEDAS = ["Bs", "USD"];

function renglonVacio(tipo = "Diezmo") {
  return { tipo_aporte: tipo, concepto: "", tipo_moneda: "Bs", monto: "" };
}

export default function RegistrarSobre() {
  const [catalogos, setCatalogos] = useState({ feligreses: [], cuentas: [] });
  const [fecha, setFecha] = useState(hoyTexto());
  const [idFeligres, setIdFeligres] = useState("");
  const [aportes, setAportes] = useState([renglonVacio()]);
  const [transferencias, setTransferencias] = useState([]);
  const [siguiente, setSiguiente] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/catalogos")
      .then((r) => r.json())
      .then((d) => !d.error && setCatalogos(d))
      .catch(() => setError("No se pudieron cargar los feligreses."));
  }, []);

  // Cada vez que cambia la fecha, consulta que numero le toca al sobre.
  const consultarSiguiente = useCallback(() => {
    if (!fecha) return;
    fetch(`/api/sobres/siguiente?fecha=${fecha}`)
      .then((r) => r.json())
      .then((d) => setSiguiente(d.siguiente ?? null))
      .catch(() => setSiguiente(null));
  }, [fecha]);

  useEffect(() => {
    consultarSiguiente();
  }, [consultarSiguiente]);

  const total = aportes.reduce((suma, a) => suma + (Number(a.monto) || 0), 0);

  function cambiarAporte(indice, campo, valor) {
    setAportes((lista) =>
      lista.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a))
    );
  }

  function cambiarTransferencia(indice, campo, valor) {
    setTransferencias((lista) =>
      lista.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t))
    );
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError("");
    setExito("");
    setGuardando(true);

    const cuerpo = {
      fecha,
      id_feligres: Number(idFeligres),
      aportes: aportes.map((a) => ({ ...a, monto: Number(a.monto) })),
      transferencias: transferencias.map((t) => ({
        ...t,
        id_cuenta: Number(t.id_cuenta),
        monto_transferencia: Number(t.monto_transferencia),
      })),
    };

    try {
      const respuesta = await fetch("/api/sobres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error);
        setGuardando(false);
        return;
      }

      // Deja el formulario listo para el siguiente sobre de la misma fecha.
      setExito(`Sobre N.o ${datos.nro_sobre} registrado por ${bolivares(total)}.`);
      setIdFeligres("");
      setAportes([renglonVacio()]);
      setTransferencias([]);
      consultarSiguiente();
    } catch {
      setError("No se pudo guardar el sobre.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Marco
      titulo="Registrar sobre"
      descripcion="Carga los aportes tal como vienen escritos en el sobre. Al guardar, el formulario queda listo para el siguiente."
    >
      {error && <div className="mensaje mensaje-error">{error}</div>}
      {exito && <div className="mensaje mensaje-ok">{exito}</div>}

      <form className="sobre" onSubmit={guardar}>
        <div className="sobre-cabecera">
          <div>
            <h2>Sobre de diezmos y ofrendas</h2>
            <p>El numero se asigna al guardar y reinicia en 1 cada mes.</p>
          </div>
          <div className="sello-numero">
            <span>N.o DE SOBRE</span>
            <strong>{siguiente ?? "--"}</strong>
          </div>
        </div>

        <div className="sobre-cuerpo">
          {/* ---------- Datos de la entrega ---------- */}
          <section className="seccion-sobre">
            <h3>Datos de la entrega</h3>
            <div className="rejilla dos">
              <div className="campo">
                <label htmlFor="fecha">Fecha</label>
                <input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="feligres">Feligres</label>
                <select
                  id="feligres"
                  value={idFeligres}
                  onChange={(e) => setIdFeligres(e.target.value)}
                  required
                >
                  <option value="">Selecciona un feligres</option>
                  {catalogos.feligreses.map((f) => (
                    <option key={f.id_feligres} value={f.id_feligres}>
                      {f.apellido}, {f.nombre} ({f.nombre_iglesia})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {catalogos.feligreses.length === 0 && (
              <div className="mensaje mensaje-aviso">
                No hay feligreses cargados. Agrega uno en la pantalla de Feligreses.
              </div>
            )}
          </section>

          {/* ---------- Aportes ---------- */}
          <section className="seccion-sobre">
            <h3>Aportes</h3>

            {aportes.map((aporte, indice) => (
              <div className="renglon" key={indice}>
                <div>
                  <label>Tipo</label>
                  <select
                    value={aporte.tipo_aporte}
                    onChange={(e) => cambiarAporte(indice, "tipo_aporte", e.target.value)}
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Concepto</label>
                  <input
                    value={aporte.concepto}
                    onChange={(e) => cambiarAporte(indice, "concepto", e.target.value)}
                    disabled={aporte.tipo_aporte !== "Ofrenda de Colaboracion"}
                    placeholder={
                      aporte.tipo_aporte === "Ofrenda de Colaboracion"
                        ? "Para que es la ofrenda"
                        : "Solo para colaboraciones"
                    }
                  />
                </div>

                <div>
                  <label>Moneda</label>
                  <select
                    value={aporte.tipo_moneda}
                    onChange={(e) => cambiarAporte(indice, "tipo_moneda", e.target.value)}
                  >
                    {MONEDAS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={aporte.monto}
                    onChange={(e) => cambiarAporte(indice, "monto", e.target.value)}
                    required
                  />
                </div>

                <button
                  type="button"
                  className="boton-texto"
                  onClick={() => setAportes((l) => l.filter((_, i) => i !== indice))}
                  disabled={aportes.length === 1}
                >
                  Quitar
                </button>
              </div>
            ))}

            <button
              type="button"
              className="boton-secundario"
              style={{ marginTop: "0.9rem" }}
              onClick={() => setAportes((l) => [...l, renglonVacio("Ofrenda de Colaboracion")])}
            >
              Agregar renglon
            </button>

            <div className="total-sobre">
              <span>Total incluido en el sobre</span>
              <strong>{bolivares(total)}</strong>
            </div>
          </section>

          {/* ---------- Transferencias ---------- */}
          <section className="seccion-sobre">
            <h3>Transferencias bancarias</h3>

            {transferencias.length === 0 && (
              <p className="suave pequeno">
                Agrega una solo si el feligres respaldo el monto con una transferencia.
              </p>
            )}

            {transferencias.map((t, indice) => (
              <div className="renglon" key={indice}>
                <div>
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={t.fecha_transferencia}
                    onChange={(e) => cambiarTransferencia(indice, "fecha_transferencia", e.target.value)}
                  />
                </div>
                <div>
                  <label>Referencia</label>
                  <input
                    value={t.nro_transferencia}
                    onChange={(e) => cambiarTransferencia(indice, "nro_transferencia", e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: "span 1" }}>
                  <label>Cuenta</label>
                  <select
                    value={t.id_cuenta}
                    onChange={(e) => cambiarTransferencia(indice, "id_cuenta", e.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {catalogos.cuentas.map((c) => (
                      <option key={c.id_cuenta} value={c.id_cuenta}>
                        {c.nombre_banco}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={t.monto_transferencia}
                    onChange={(e) => cambiarTransferencia(indice, "monto_transferencia", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="boton-texto"
                  onClick={() => setTransferencias((l) => l.filter((_, i) => i !== indice))}
                >
                  Quitar
                </button>
              </div>
            ))}

            <button
              type="button"
              className="boton-secundario"
              style={{ marginTop: "0.9rem" }}
              onClick={() =>
                setTransferencias((l) => [
                  ...l,
                  {
                    fecha_transferencia: fecha,
                    nro_transferencia: "",
                    id_cuenta: "",
                    monto_transferencia: "",
                  },
                ])
              }
            >
              Agregar transferencia
            </button>
          </section>

          <div className="fila-botones">
            <button type="submit" className="boton-sello" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar sobre"}
            </button>
            <span className="suave pequeno">
              Se guardara como el sobre N.o {siguiente ?? "--"} de este mes.
            </span>
          </div>
        </div>
      </form>
    </Marco>
  );
}

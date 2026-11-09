"use client";

import { useEffect, useState } from "react";
import Marco from "@/components/Marco";

export default function Feligreses() {
  const [feligreses, setFeligreses] = useState([]);
  const [iglesias, setIglesias] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    email: "",
    id_iglesia: "",
  });
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    fetch("/api/feligreses")
      .then((r) => r.json())
      .then((d) => setFeligreses(Array.isArray(d) ? d : []));
    fetch("/api/catalogos")
      .then((r) => r.json())
      .then((d) => setIglesias(d.iglesias || []));
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError("");
    setExito("");
    setGuardando(true);

    try {
      const respuesta = await fetch("/api/feligreses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formulario, id_iglesia: Number(formulario.id_iglesia) }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error);
        return;
      }

      setExito(`${formulario.nombre} ${formulario.apellido} quedo registrado.`);
      setFormulario({ nombre: "", apellido: "", email: "", id_iglesia: formulario.id_iglesia });
      cargar();
    } catch {
      setError("No se pudo guardar el feligres.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Marco
      titulo="Feligreses"
      descripcion="Personas que entregan sobres. Debes registrarlas antes de cargarles un sobre."
    >
      {error && <div className="mensaje mensaje-error">{error}</div>}
      {exito && <div className="mensaje mensaje-ok">{exito}</div>}

      <div className="rejilla" style={{ gridTemplateColumns: "340px 1fr", alignItems: "start" }}>
        <form className="tarjeta" onSubmit={guardar}>
          <h2 style={{ marginBottom: "1rem" }}>Agregar feligres</h2>

          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              value={formulario.nombre}
              onChange={(e) => cambiar("nombre", e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              value={formulario.apellido}
              onChange={(e) => cambiar("apellido", e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="email">Correo (opcional)</label>
            <input
              id="email"
              type="email"
              value={formulario.email}
              onChange={(e) => cambiar("email", e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="iglesia">Iglesia</label>
            <select
              id="iglesia"
              value={formulario.id_iglesia}
              onChange={(e) => cambiar("id_iglesia", e.target.value)}
              required
            >
              <option value="">Selecciona una iglesia</option>
              {iglesias.map((i) => (
                <option key={i.id_iglesia} value={i.id_iglesia}>
                  {i.nombre_iglesia} - {i.ciudad}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="boton-principal" disabled={guardando} style={{ width: "100%" }}>
            {guardando ? "Guardando..." : "Agregar feligres"}
          </button>
        </form>

        <div className="tabla-envoltura">
          {feligreses.length === 0 ? (
            <p className="vacio">Todavia no hay feligreses registrados.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Apellido</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Iglesia</th>
                </tr>
              </thead>
              <tbody>
                {feligreses.map((f) => (
                  <tr key={f.id_feligres}>
                    <td>{f.apellido}</td>
                    <td>{f.nombre}</td>
                    <td>{f.email || <span className="suave">sin correo</span>}</td>
                    <td>
                      {f.nombre_iglesia}
                      <span className="suave pequeno"> - {f.ciudad}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Marco>
  );
}

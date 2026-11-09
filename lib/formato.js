// Formato de montos y fechas usado en pantallas y reportes.

export function bolivares(valor) {
  return Number(valor || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fechaCorta(valor) {
  if (!valor) return "";
  // Las fechas llegan como 2026-11-08 o como ISO completo.
  const texto = String(valor).slice(0, 10);
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function hoyTexto() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

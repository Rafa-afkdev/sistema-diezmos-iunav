import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Genera un PDF con encabezado institucional, tabla y fila de totales.
export function generarPdf({ titulo, subtitulo, columnas, filas, totales, archivo }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Iglesia Adventista del Septimo Dia", ancho / 2, 48, { align: "center" });

  doc.setFontSize(12);
  doc.text(titulo, ancho / 2, 68, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitulo, ancho / 2, 85, { align: "center" });

  autoTable(doc, {
    startY: 105,
    head: [columnas],
    body: filas,
    foot: totales ? [totales] : undefined,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [21, 50, 92], textColor: 255, halign: "center" },
    footStyles: { fillColor: [240, 243, 248], textColor: [21, 50, 92], fontStyle: "bold" },
    columnStyles: columnasNumericas(columnas),
  });

  const y = doc.lastAutoTable.finalY + 25;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generado el ${new Date().toLocaleString("es-VE")}`, 40, y);

  doc.save(archivo);
}

// Alinea a la derecha toda columna cuyo titulo hable de montos.
function columnasNumericas(columnas) {
  const estilos = {};
  columnas.forEach((titulo, indice) => {
    if (/monto|total/i.test(titulo)) {
      estilos[indice] = { halign: "right" };
    }
  });
  return estilos;
}

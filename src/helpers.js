import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, ImageRun } from "docx";

const OFFSET = 45;
const OFFSET_LESS = 15;

export const insertSignatureToPDF = async (
   file,
   signatureDataURL,
   position,
   signatureSize
) => {
   const fileBytes = await file.arrayBuffer();

   const pdfDoc = await PDFDocument.load(fileBytes);
   const pages = pdfDoc.getPages();
   const firstPage = pages[0];

   const { width: pageWidth, height: pageHeight } = firstPage.getSize();

   // Потрібно знати ширину контейнера в px, з якого бралась позиція
   const viewerWidth = 600; // Відповідає стилю у твоєму <div style={{ width: "600px" }}>
   const scaleFactor = pageWidth / viewerWidth;

   // Конвертація координат
   const pdfX = position.x * scaleFactor;
   const pdfY = pageHeight - position.y * scaleFactor; // PDF координати — знизу вгору

   const pngImage = await pdfDoc.embedPng(signatureDataURL);

   // Конвертація розміру підпису
   const displayWidthInPx = viewerWidth * (signatureSize / 100); // в px
   const displayWidthInPDF = displayWidthInPx * scaleFactor;

   const aspectRatio = pngImage.height / pngImage.width;
   const displayHeightInPDF = displayWidthInPDF * aspectRatio;

   firstPage.drawImage(pngImage, {
      x: pdfX + OFFSET_LESS,
      y: pdfY - displayHeightInPDF - OFFSET, // відступаємо вниз на висоту зображення
      width: displayWidthInPDF,
      height: displayHeightInPDF,
   });

   const pdfBytes = await pdfDoc.save();
   const blob = new Blob([pdfBytes], { type: "application/pdf" });
   saveAs(blob, "signed-document.pdf");
};

export const insertSignatureToDocx = async (
   signatureDataURL,
   position,
   signatureSize
) => {
   const response = await fetch(signatureDataURL);
   const blob = await response.blob();
   const arrayBuffer = await blob.arrayBuffer();

   // Переведемо позицію (в px) у EMUs — одиниці Word (1 px ≈ 9525 EMUs)
   const pxToEmu = (px) => Math.round(px * 9525);

   const viewerWidth = 600; // Відповідає ширині контейнера в UI

   const displayWidthInPx = viewerWidth * (signatureSize / 100);
   const aspectRatio = 60 / 150; // твоє співвідношення (height/width) = 0.4
   const displayHeightInPx = displayWidthInPx * aspectRatio;

   const doc = new Document({
      sections: [
         {
            properties: {},
            children: [
               new Paragraph("Документ з підписом:"),
               new Paragraph({
                  children: [
                     new ImageRun({
                        data: arrayBuffer,
                        transformation: {
                           width: pxToEmu(displayWidthInPx),
                           height: pxToEmu(displayHeightInPx),
                        },
                        floating: {
                           horizontalPosition: {
                              offset: pxToEmu(position.x),
                           },
                           verticalPosition: {
                              offset: pxToEmu(position.y),
                           },
                           wrap: {
                              type: "none",
                           },
                        },
                     }),
                  ],
               }),
            ],
         },
      ],
   });

   const buffer = await Packer.toBlob(doc);
   saveAs(buffer, "signed-document.docx");
};

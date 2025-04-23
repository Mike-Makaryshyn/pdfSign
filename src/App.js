import React, { useState, useEffect, useRef } from "react";
import MySignaturePad from "./components/MySignaturePad";
import { insertSignatureToPDF, insertSignatureToDocx } from "./helpers";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "./App.css";

function App() {
   const [imageURL, setImageURL] = useState(null); // Підпис
   const [file, setFile] = useState(null); // Файл для завантаження
   const [position, setPosition] = useState({ x: 0, y: 0 }); // Позиція підпису
   const [signatureSize, setSignatureSize] = useState(15);
   const sigCanvas = useRef({});
   const [pdfFile, setPdfFile] = useState(null);
   const pdfContainerRef = useRef(null);
   const [isDragging, setIsDragging] = useState(false);
   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

   // Функція для очищення підпису
   const clear = () => sigCanvas.current.clear();

   // Функція для зміни розміру підпису
   const handleSizeChange = (e) => {
      const size = e.target.value;
      setSignatureSize(size);
   };

   // Функція для збереження підпису
   const onSave = (dataURL) => {
      setImageURL(dataURL); // Зберігаємо зображення в стейт
   };

   // Функція для завантаження файлу
   const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
         setFile(selectedFile);
         if (selectedFile.type === "application/pdf") {
            setPdfFile(URL.createObjectURL(selectedFile));
         }
      }
   };

   useEffect(() => {
      const handleMouseMove = (e) => {
         if (isDragging && pdfContainerRef.current) {
            const containerRect =
               pdfContainerRef.current.getBoundingClientRect();

            const mouseX = e.clientX;
            const mouseY = e.clientY;

            const x = mouseX - containerRect.left - dragOffset.x;
            const y = mouseY - containerRect.top - dragOffset.y;

            setPosition({ x, y });
         }
      };
      const handleMouseUp = () => {
         if (isDragging) {
            setIsDragging(false); // Завершуємо перетягування
            // Зберігаємо кінцеві координати після перетягування
            setPosition((prevPosition) => ({
               x: prevPosition.x,
               y: prevPosition.y,
            }));
         }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
         document.removeEventListener("mousemove", handleMouseMove);
         document.removeEventListener("mouseup", handleMouseUp);
      };
   }, [isDragging, dragOffset]);

   return (
      <div className="App">
         <h1>Signature Pad Example</h1>
         <div className="container">
            <MySignaturePad
               onSave={onSave}
               clear={clear}
               sigCanvas={sigCanvas}
            />

            {/* Поле для зміни розміру підпису */}
            {imageURL && (
               <input
                  type="range"
                  min="1"
                  max="200"
                  value={signatureSize}
                  onChange={handleSizeChange}
                  style={{
                     position: "fixed",
                     right: "150px",
                     top: "0",
                     bottom: "0",
                     margin: "auto 0",
                     border: "1px dashed gray",
                  }}
               />
            )}

            <br />
            <br />

            <br />
            {/* Вибір файлу */}
            <input
               type="file"
               accept=".pdf,.docx"
               onChange={handleFileChange}
            />

            {/* Кнопка для генерування документа з підписом */}
            <button
               className="generate"
               onClick={() => {
                  if (file && imageURL) {
                     if (file.name.endsWith(".pdf")) {
                        insertSignatureToPDF(
                           file,
                           imageURL,
                           position,
                           signatureSize
                        );
                     } else if (file.name.endsWith(".docx")) {
                        insertSignatureToDocx(
                           imageURL,
                           position,
                           signatureSize
                        );
                     }
                  }
               }}
            >
               Згенерувати документ з підписом
            </button>

            {/* Перегляд PDF файлу */}
            {pdfFile && (
               <div
                  ref={pdfContainerRef}
                  style={{
                     position: "relative",
                     width: "600px",
                     margin: "24px auto",
                     border: "1px solid #ccc",
                     cursor: "crosshair",
                  }}
               >
                  {/* Перегляд PDF */}
                  <Worker workerUrl="/pdfjs/pdf.worker.min.js">
                     <Viewer fileUrl={pdfFile} />
                  </Worker>

                  {/* Тимчасовий підпис */}
                  {imageURL && (
                     <img
                        src={imageURL}
                        alt="temporary signature"
                        style={{
                           position: "absolute",
                           top: position.y,
                           left: position.x,
                           width: `${signatureSize}%`,
                           opacity: 0.6,
                           border: "1px dashed gray",
                        }}
                        onMouseDown={(e) => {
                           const containerRect =
                              pdfContainerRef.current.getBoundingClientRect();

                           const mouseX = e.clientX;
                           const mouseY = e.clientY;

                           const offsetX =
                              mouseX - containerRect.left - position.x;
                           const offsetY =
                              mouseY - containerRect.top - position.y;

                           setIsDragging(true);
                           setDragOffset({ x: offsetX, y: offsetY });

                           e.preventDefault();
                        }}
                     />
                  )}
               </div>
            )}
         </div>
      </div>
   );
}

export default App;

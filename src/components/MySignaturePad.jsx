import SignaturePad from "react-signature-canvas";
import Popup from "reactjs-popup";

export default function MySignaturePad({ onSave, clear, sigCanvas }) {
   const handleSave = () => {
      // Перевіряємо, чи є підпис
      if (sigCanvas.current.isEmpty()) {
         alert("Please provide a signature first.");
      } else {
         // Отримуємо зображення підпису
         const dataURL = sigCanvas.current.toDataURL("image/png");
         onSave(dataURL); // Викликаємо функцію onSave з dataURL
      }
   };

   return (
      <Popup
         modal
         trigger={<button className="openPad">Open Signature Pad</button>}
         contentStyle={{
            width: "600px",
            height: "390px",
            padding: "20px",
            zIndex: 9999, // Дуже високий z-index
         }}
         overlayStyle={{
            background: "rgba(0, 0, 0, 0.8)", // чорний напівпрозорий фон
            zIndex: 9998,
         }}
      >
         {(close) => (
            <>
               <SignaturePad
                  ref={sigCanvas}
                  canvasProps={{
                     className: "signatureCanvas",
                  }}
               />
               {/* Button to trigger save canvas image */}
               <button
                  onClick={() => {
                     handleSave();
                     close();
                  }}
               >
                  Save
               </button>
               <button onClick={clear}>Clear</button>
               <button onClick={close}>Close</button>
            </>
         )}
      </Popup>
   );
}

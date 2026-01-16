import { useState } from "react";
import { Banner } from "../components";

export const GdprPage = () => {
  const [open, setOpen] = useState(false);
  const imgSrc =
    "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/gdpr.png";

  return (
    <>
      <Banner />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white shadow-sm rounded-md p-6 text-center">
          <h1 className="text-xl font-semibold mb-4">
            GDPR - Ordenssamfundet VS
          </h1>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 transition text-white rounded-md"
          >
            Öppna Dokument
          </button>
          <div className="mt-4 text-sm text-gray-600">
            Visa GDPR-dokumentet i ett popup fönster.
          </div>
        </div>

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-4xl h-[90vh] bg-white rounded-md shadow-lg overflow-auto">
              <div className="p-2 flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 transition rounded-md"
                  aria-label="Stäng dialog"
                >
                  Stäng
                </button>
              </div>

              <div className="p-4 h-[calc(90vh-3rem)] flex items-center justify-center">
                <img
                  src={imgSrc}
                  alt="GDPR information från Ordenssamfundet VS"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

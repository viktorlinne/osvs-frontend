import { useState, useEffect } from "react";

const gdprImageUrl = "/gdpr.png";

export const GdprPage = () => {
  const [open, setOpen] = useState(false);


  // Prevent background scroll when fullscreen is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      {/* Preview image */}
      <img
        src={gdprImageUrl}
        alt="GDPR information från Ordenssamfundet VS"
        onClick={() => setOpen(true)}
        className="max-w-full max-h-[100vh] object-contain cursor-zoom-in"
      />

      {/* Fullscreen overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={gdprImageUrl}
            alt="GDPR information fullskärmsvy"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};
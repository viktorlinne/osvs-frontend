import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    if (seconds === 0) {
      navigate("/", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-3xl mb-4">404</h2>
      <p className="mb-4">Sidan hittades inte</p>
      <p className="mb-4 text-sm text-gray-500">
        Du omdirigeras till startsidan om {seconds} sekunder...
      </p>
    </div>
  );
};
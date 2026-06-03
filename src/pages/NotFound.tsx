import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageContainer } from "../components";

export const NotFound = () => {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (seconds === 0) {
      navigate("/", { replace: true });
      return;
    }
    const timer = setTimeout(() => setSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, navigate]);

  return (
    <PageContainer
      size="md"
      className="ui-page flex min-h-[60vh] items-center justify-center"
    >
      <div className="ui-card w-full max-w-sm text-center">
        <p className="mb-2 text-5xl font-bold text-primary-600">404</p>
        <h2 className="ui-section-title mb-3">Sidan hittades inte</h2>
        <p className="mb-5 text-sm text-neutral-600">
          Du omdirigeras till startsidan om {seconds} sekunder...
        </p>
        <Link to="/" className="ui-btn ui-btn-primary">
          Gå till startsidan
        </Link>
      </div>
    </PageContainer>
  );
};
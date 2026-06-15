import React, { useEffect, useRef, useState } from "react";

export function NavDropdown({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleItemClick = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`ui-nav-item inline-flex items-center gap-1 ${
          open
            ? "bg-primary-50 text-primary-700"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
      >
        {label}
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={open ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"}
          />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[10rem] rounded border border-neutral-200 bg-neutral-50 py-1 shadow-card"
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(
                  child as React.ReactElement<{ onClick?: () => void; inDropdown?: boolean }>,
                  { onClick: handleItemClick, inDropdown: true },
                )
              : child,
          )}
        </div>
      )}
    </div>
  );
}

export default NavDropdown;

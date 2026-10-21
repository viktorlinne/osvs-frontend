import React, { useEffect, useId, useRef, useState } from "react";

/**
 * Disclosure-style navigation dropdown (not an ARIA menu: it only contains
 * links). The button toggles a panel with `aria-expanded`/`aria-controls`;
 * Escape closes it and returns focus to the button; clicking outside, tabbing
 * out of it or following a link closes it.
 */
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent | MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const focusInside = containerRef.current?.contains(document.activeElement);
      setOpen(false);
      if (focusInside) buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleItemClick = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        // Close when keyboard focus moves outside the dropdown.
        const next = event.relatedTarget as Node | null;
        if (next && !event.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls={panelId}
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
      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full z-50 mt-1 min-w-[10rem] rounded border border-neutral-200 bg-neutral-50 py-1 shadow-card"
      >
        <ul>
          {React.Children.map(children, (child) =>
            React.isValidElement(child) ? (
              <li>
                {React.cloneElement(
                  child as React.ReactElement<{ onClick?: () => void; inDropdown?: boolean }>,
                  { onClick: handleItemClick, inDropdown: true },
                )}
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </div>
  );
}

export default NavDropdown;

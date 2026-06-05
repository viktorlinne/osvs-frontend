import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PageContainer } from "../components";

const GDPR_DOC_URL = "/gdpr.png";

function DocumentViewer() {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const openViewer = useCallback(() => setOpen(true), []);
  const closeViewer = useCallback(() => setOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) overlayRef.current?.focus();
  }, [open]);

  function handleOverlayKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") closeViewer();
  }

  function handleThumbnailKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openViewer();
    }
  }

  if (imgError) {
    return (
      <p className="text-sm text-neutral-600 italic">
        Dokumentet kunde inte laddas. Kontakta din logesekreterare.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={openViewer}
          onKeyDown={handleThumbnailKeyDown}
          className="group relative block w-full overflow-hidden rounded-md border border-neutral-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label="Visa originaldokumentet i helskärm"
        >
          <img
            src={GDPR_DOC_URL}
            alt="Personuppgiftspolicy — originaldokument"
            onError={() => setImgError(true)}
            className="h-48 w-full cursor-zoom-in object-contain transition-opacity duration-150 group-hover:opacity-80"
          />
        </button>
        <a
          href={GDPR_DOC_URL}
          download="OSVS-personuppgiftspolicy.png"
          className="ui-link block text-xs"
        >
          Ladda ned originaldokument
        </a>
      </div>

      {open &&
        createPortal(
          <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Originaldokument — personuppgiftspolicy"
            tabIndex={-1}
            onClick={closeViewer}
            onKeyDown={handleOverlayKeyDown}
            className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-neutral-900/90 p-4 focus-visible:outline-none"
          >
            <img
              src={GDPR_DOC_URL}
              alt="Personuppgiftspolicy — originaldokument"
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md bg-neutral-900/60 text-white hover:bg-neutral-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Stäng"
            >
              ✕
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

const rights = [
  {
    title: "Rätt till tillgång",
    description:
      "Du har rätt att begära ett utdrag av de personuppgifter som behandlas om dig.",
  },
  {
    title: "Rätt till rättelse",
    description:
      "Du har rätt att begära att felaktiga eller ofullständiga uppgifter rättas.",
  },
  {
    title: "Rätt till radering",
    description:
      "Du kan under vissa förutsättningar begära att dina uppgifter raderas, exempelvis om ändamålet med behandlingen har upphört.",
  },
  {
    title: "Rätt till begränsning",
    description:
      "Du kan begära att behandlingen av dina uppgifter begränsas under den tid en invändning eller begäran om rättelse prövas.",
  },
  {
    title: "Rätt att invända",
    description:
      "Du har rätt att invända mot behandling som grundar sig på berättigat intresse.",
  },
  {
    title: "Rätt till dataportabilitet",
    description:
      "För uppgifter som behandlas med stöd av samtycke eller avtal har du rätt att få dem utlämnade i ett maskinläsbart format.",
  },
  {
    title: "Rätt att klaga",
    description:
      "Om du anser att vi behandlar dina uppgifter felaktigt har du rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY), imy.se.",
  },
];

export const GdprPage = () => {
  return (
    <PageContainer size="lg" className="ui-page">
      <h1 className="mb-10 text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
        Personuppgiftspolicy
      </h1>

      <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">

        <div className="space-y-10 text-sm text-neutral-700">

          <section className="space-y-3">
            <h2 className="ui-section-title">Personuppgiftsansvarig</h2>
            <p>
              Ordensamfundet VS är personuppgiftsansvarig för den behandling av
              personuppgifter som sker inom ramen för logeverksamheten. Varje
              loge ansvarar för behandlingen av uppgifter om sina egna
              medlemmar.
            </p>
            <p>
              Frågor om hur dina personuppgifter hanteras riktas till din loges
              sekreterare eller logemästare. Kontaktuppgifter till respektive
              loge finns på sidan{" "}
              <a href="/contact" className="ui-link">
                Kontakt
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="ui-section-title">Vilka uppgifter behandlar vi?</h2>
            <p>
              I samband med inval och under pågående medlemskap behandlar vi
              följande kategorier av personuppgifter:
            </p>
            <ul className="space-y-1.5 pl-5">
              {[
                "Namn och adress",
                "Telefonnummer och e-postadress",
                "Personnummer (för identifiering vid inval)",
                "Grad och datum för recipiering i respektive grad",
                "Närvaro vid möten och ceremonier",
                "Betalningshistorik för logeårsavgift",
              ].map((item) => (
                <li key={item} className="list-disc marker:text-primary-600">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="ui-section-title">Ändamål och rättslig grund</h2>
            <div className="space-y-2">
              {[
                {
                  title: "Medlemsadministration",
                  basis: "Avtal",
                  desc: "Hantering av medlemskap, gradregister, avgiftsdebitering och inbjudningar till möten.",
                },
                {
                  title: "Kommunikation",
                  basis: "Berättigat intresse",
                  desc: "Utskick av kallelser, protokoll och information som rör logeverksamheten.",
                },
                {
                  title: "Historik och arkiv",
                  basis: "Berättigat intresse",
                  desc: "Bevarande av logens historia, inklusive matrikel och hederslistor, i enlighet med ordenssamfundets stadgar.",
                },
              ].map(({ title, basis, desc }) => (
                <div key={title} className="ui-entry">
                  <div className="mb-0.5 flex items-baseline gap-3">
                    <p className="ui-chapter">{title}</p>
                    <span className="text-xs text-neutral-600">
                      Rättslig grund: {basis}
                    </span>
                  </div>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="ui-section-title">Lagringstid</h2>
            <p>
              Uppgifter om aktiva medlemmar bevaras under hela medlemskapets
              löptid. Vid utträde eller uteslutning anonymiseras operativa
              uppgifter (kontaktuppgifter, betalningshistorik) inom 12 månader.
            </p>
            <p>
              Historiska uppgifter av ordenshistorisk karaktär, såsom
              gradregister och matrikel, kan bevaras på obestämd tid i
              enlighet med ordenssamfundets stadgar och historiska ansvar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="ui-section-title">Utlämning av uppgifter</h2>
            <p>
              Personuppgifter delas inte med tredje part utanför
              Ordensamfundet VS, med undantag för situationer där det krävs
              enligt lag. Uppgifter kan delas mellan logerna inom samfundet i
              samband med gradsarbete och ordensmöten.
            </p>
          </section>

        </div>

        <aside className="space-y-8">
          <section className="space-y-4">
            <h2 className="ui-section-title">Dina rättigheter</h2>
            <div>
              {rights.map(({ title, description }) => (
                <div key={title} className="ui-entry">
                  <p className="ui-chapter mb-1">{title}</p>
                  <p className="text-sm text-neutral-700">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="ui-section-title">Originaldokument</h2>
            <DocumentViewer />
          </section>

          <section className="space-y-3">
            <h2 className="ui-section-title">Kontakt</h2>
            <p className="text-sm text-neutral-700">
              Frågor och begäranden rörande dina personuppgifter riktas till
              din loge. Kontaktuppgifter finns på{" "}
              <a href="/contact" className="ui-link">
                Kontaktsidan
              </a>
              .
            </p>
            <p className="text-sm text-neutral-700">
              Klagomål kan lämnas till Integritetsskyddsmyndigheten:{" "}
              <a
                href="https://www.imy.se"
                className="ui-link"
                target="_blank"
                rel="noreferrer"
              >
                imy.se
              </a>
            </p>
          </section>
        </aside>

      </div>
    </PageContainer>
  );
};

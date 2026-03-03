import { PageContainer } from "../components";

export const ContactPage = () => {
  return (
    <PageContainer size="xl" className="ui-page">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="space-y-4">
          <h2 className="ui-section-title text-primary-600">Kontakt</h2>
          <div className="flex h-auto w-full items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white">
            <img
              src="https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/contact.png"
              alt="osvs"
            />
          </div>
        </section>

        <section className="space-y-6 text-sm text-neutral-700">
          <h2 className="ui-section-title text-primary-600">Organisation</h2>
          <hr className="border-neutral-200" />
          <h3 className="text-xl font-semibold text-primary-600">Förtroenderådet</h3>
          <p>Består av Logernas Logemästare, Logekansler och Logesekreterare</p>
          <hr className="border-neutral-200" />

          <h3 className="text-xl font-semibold text-primary-600">Ordensmästare</h3>
          <p>Benämning på ordförande i förtroenderådet</p>
          <hr className="border-neutral-200" />

          <h3 className="text-xl font-semibold text-primary-600">Ordenssekreterare</h3>
          <p>Benämning på sekreteraren i förtroenderådet</p>
          <hr className="border-neutral-200" />
        </section>

        <section className="space-y-6 text-sm text-neutral-700">
          <h2 className="ui-section-title text-primary-600">Logernas Kontakt</h2>
          <hr className="border-neutral-200" />
          <h3 className="text-xl font-semibold text-primary-600">Stamlogen</h3>
          <div className="flex flex-col">
            <p>Karlskrona</p>
            <p>
              E-post:{" "}
              <a className="ui-link" href="mailto:stamlogen@osvs.se">
                stamlogen@osvs.se
              </a>
            </p>
          </div>

          <h3 className="text-xl font-semibold text-primary-600">Logen Stella Polaris</h3>
          <div className="flex flex-col">
            <p>Helsingborg</p>
            <p>
              E-post:{" "}
              <a className="ui-link" href="mailto:stellapolaris@osvs.se">
                stellapolaris@osvs.se
              </a>
            </p>
          </div>

          <h3 className="text-xl font-semibold text-primary-600">Logen Regulus</h3>
          <div className="flex flex-col">
            <p>Ängelholm</p>
            <p>
              E-post:{" "}
              <a className="ui-link" href="mailto:regulus@osvs.se">
                regulus@osvs.se
              </a>
            </p>
          </div>

          <h3 className="text-xl font-semibold text-primary-600">Logen Orion</h3>
          <div className="flex flex-col">
            <p>Göteborg</p>
            <p>
              E-post:{" "}
              <a className="ui-link" href="mailto:orion@osvs.se">
                orion@osvs.se
              </a>
            </p>
          </div>

          <h3 className="text-xl font-semibold text-primary-600">Capella</h3>
          <div className="flex flex-col">
            <p>Halmstad</p>
            <p>
              E-post:{" "}
              <a className="ui-link" href="mailto:capella@osvs.se">
                capella@osvs.se
              </a>
            </p>
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

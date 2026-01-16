import { Banner } from "../components";

export const ContactPage = () => {
  return (
    <>
      <Banner />
      <div className="min-h-screen flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-600">Kontakt</h2>
            <div className="w-full h-auto border rounded-md overflow-hidden bg-white flex items-center justify-center">
              <img
                src="https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/contact.png"
                alt="osvs"
              />
            </div>
          </section>

          <section className="space-y-6 text-sm text-gray-800">
            <h2 className="text-2xl font-semibold text-green-600">
              Organisation
            </h2>
            <hr />
            <h3 className="text-xl font-semibold text-green-600">
              Förtroenderådet
            </h3>
            <p>
              Består av Logernas Logemästare, Logekansler och Logesekreterare
            </p>
            <hr />

            <h3 className="text-xl font-semibold text-green-600">
              Ordensmästare
            </h3>
            <p>Benämning på ordförande i förtroenderådet</p>
            <hr />

            <h3 className="text-xl font-semibold text-green-600">
              Ordenssekreterare
            </h3>
            <p>Benämning på sekreteraren i förtroenderådet</p>
            <hr />
          </section>

          <section className="space-y-6 text-sm text-gray-800">
            <h2 className="text-2xl font-semibold text-green-600">
              Logernas Kontakt
            </h2>
            <hr />
            <h3 className="text-xl font-semibold text-green-600">Stamlogen</h3>
            <div className="flex flex-col">
              <p>Karlskrona</p>
              <p>
                E-post:{" "}
                <a
                  className="text-green-600 hover:text-green-700 hover:underline"
                  href="mailto:stamlogen@osvs.se"
                >
                  stamlogen@osvs.se
                </a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-green-600">
              Logen Stella Polaris
            </h3>
            <div className="flex flex-col">
              <p>Helsingborg</p>
              <p>
                E-post:{" "}
                <a
                  className="text-green-600 hover:text-green-700 hover:underline"
                  href="mailto:stellapolaris@osvs.se"
                >
                  stellapolaris@osvs.se
                </a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-green-600">
              Logen Regulus
            </h3>
            <div className="flex flex-col">
              <p>Ängelholm</p>
              <p>
                E-post:{" "}
                <a
                  className="text-green-600 hover:text-green-700 hover:underline"
                  href="mailto:regulus@osvs.se"
                >
                  regulus@osvs.se
                </a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-green-600">
              Logen Orion
            </h3>
            <div className="flex flex-col">
              <p>Göteborg</p>
              <p>
                E-post:{" "}
                <a
                  className="text-green-600 hover:text-green-700 hover:underline"
                  href="mailto:orion@osvs.se"
                >
                  orion@osvs.se
                </a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-green-600">Capella</h3>
            <div className="flex flex-col">
              <p>Halmstad</p>
              <p>
                E-post:{" "}
                <a
                  className="text-green-600 hover:text-green-700 hover:underline"
                  href="mailto:capella@osvs.se"
                >
                  capella@osvs.se
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

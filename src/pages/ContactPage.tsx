import { PageContainer } from "../components";

const roles = [
  {
    title: "Förtroenderådet",
    description: "Består av Logernas Logemästare, Logekansler och Logesekreterare",
  },
  {
    title: "Ordensmästare",
    description: "Benämning på ordförande i förtroenderådet",
  },
  {
    title: "Ordenssekreterare",
    description: "Benämning på sekreteraren i förtroenderådet",
  },
];

const lodges = [
  { name: "Stamlogen", city: "Karlskrona", email: "stamlogen@osvs.se" },
  { name: "Logen Stella Polaris", city: "Helsingborg", email: "stellapolaris@osvs.se" },
  { name: "Logen Regulus", city: "Ängelholm", email: "regulus@osvs.se" },
  { name: "Logen Orion", city: "Göteborg", email: "orion@osvs.se" },
  { name: "Logen Capella", city: "Halmstad", email: "capella@osvs.se" },
];

export const ContactPage = () => {
  return (
    <PageContainer size="xl" className="ui-page">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">

        <section className="space-y-4">
          <h2 className="ui-section-title">Kontakt</h2>
          <div className="overflow-hidden rounded-md border border-neutral-200">
            <img
              src="/contact.png"
              alt="Ordensamfundet VS, tidigare bröder"
              className="h-auto w-full object-cover"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">

          <section>
            <h2 className="ui-section-title mb-4">Organisation</h2>
            <div>
              {roles.map(({ title, description }) => (
                <div key={title} className="ui-entry">
                  <p className="ui-chapter mb-1">{title}</p>
                  <p className="text-sm text-neutral-700">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="ui-section-title mb-4">Logernas Kontakt</h2>
            <div>
              {lodges.map(({ name, city, email }) => (
                <div key={name} className="ui-entry">
                  <p className="ui-chapter mb-0.5">{name}</p>
                  <p className="text-sm text-neutral-700">{city}</p>
                  <a className="ui-link" href={`mailto:${email}`}>{email}</a>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </PageContainer>
  );
};

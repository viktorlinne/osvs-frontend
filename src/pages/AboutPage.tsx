
export const AboutPage = () => {
  return (
    <>
      <div className="min-h-screen flex items-start justify-center py-12 px-6 ">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-600">
              Om Ordensamfundet VS
            </h2>
            <div className="w-full h-56 border rounded-md overflow-hidden bg-white flex items-center justify-center">
              <img
                src="https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/info.png"
                alt="osvs"
              />
            </div>
            <p className="text-sm text-gray-600">
              Ordenssamfundet VS är en sluten orden med för samtliga loger
              gemensamma ordningsregler och grader.
            </p>
            <h3 className="text-2xl font-medium text-green-600">
              Samfundet består av:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Stamlogen i Karskrona bildad 7 september 1924</li>
              <li>Logen Stella Polaris i Helsingborg 21 mars 1931</li>
              <li>Logen Regulus i Ängelholm 15 januari 1933</li>
              <li>Logen Orion i Göteborg bildad 26 februari 1943</li>
              <li>Logen Capella i Halmstad 28 november 1975</li>
            </ul>
          </section>

          <section className="space-y-6 text-sm text-gray-800">
            <h2 className="text-2xl font-semibold text-green-600">
              Vad vill VS?
            </h2>
            <p>
              Samfundet VS vill sammanföra män av olika åldrar, intressen och
              yrken till broderlig samvaro under värdiga sällskapliga former för
              att slå vakt omkring våra humanitära, ideella och kulturella
              värden.
            </p>

            <h2 className="text-2xl font-semibold text-green-600">
              Vad kan VS erbjuda dig?
            </h2>
            <p>
              En afton i logen omfattar en högtidlig upptagning av Bröder i
              någon av graderna. Kvällen avslutas som regel med en brödramåltid
              i angenäm samvaro genom att Bröder i olika åldrar och av skilda
              yrken och grader får tillfälle till ett utbyte av tankar och
              åsikter i kanske för dig aktuella spörsmål.
            </p>

            <h2 className="text-2xl font-semibold text-green-600">
              Vad är VS?
            </h2>
            <p>
              Initialenerna VS bär olika betydelse i graderna. Den slutliga
              avsöjas inte förrän medlemmen recipierar i högsta graden. Den
              medmänskliga livssynen är grunden för Ordenssamfundets VS´s etik
              och ideal. VS tvingar inga medlemmar någon viss
              religionsuppfattning. En broder i VS deltar med den egna tron.
            </p>
          </section>

          <section className="space-y-6 text-sm text-gray-800">
            <h2 className="text-2xl font-semibold text-green-600">
              Varför bara män?
            </h2>
            <p>
              I vår tid, när jämställdheten mellan man och kvinna är en
              självklarhet, kan det verka egendomligt att Ordern är öppen endast
              för män. När samfundet grundades 1924 hade några av grundarna den
              erfarenheten från andra ordenssamfund med enbart manliga medlemmar
              enligt traditioner, som går tillbaka till medeltiden. Än idag
              följer vi dessa traditioner. Detta betyder inte att
              Ordenssamfundet VS på något sätt nedvärderar kvinnan.
            </p>

            <h2 className="text-2xl font-semibold text-green-600">
              VS Damerna
            </h2>
            <p>
              Våra damer kan knytas till Ordenssamfundet genom ett medlemskap i
              Damklubben. Klubben har till syfte, förutom nöjet av gemensamt
              umgänge, att genom aktivitet stödja och främja arbetet inom "sin
              loge". Damklubbens i logen insatser har visat sig ha en mycket
              stor betydelse för logerna, och Damernas arbete har rönt en stor
              uppskattning bland bröderna.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

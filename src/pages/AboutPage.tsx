import { PageContainer } from "../components";

export const AboutPage = () => {
  return (
    <PageContainer size="xl" className="ui-page">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="space-y-4">
          <h2 className="ui-section-title text-primary-600">Om Ordensamfundet VS</h2>
          <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white">
            <img
              src="https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/info.png"
              alt="osvs"
            />
          </div>
          <p className="text-sm text-neutral-600">
            Ordenssamfundet VS Ã¤r en sluten orden med fÃ¶r samtliga loger
            gemensamma ordningsregler och grader.
          </p>
          <h3 className="text-xl font-medium text-primary-600">Samfundet bestÃ¥r av:</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600">
            <li>Stamlogen i Karskrona bildad 7 september 1924</li>
            <li>Logen Stella Polaris i Helsingborg 21 mars 1931</li>
            <li>Logen Regulus i Ã„ngelholm 15 januari 1933</li>
            <li>Logen Orion i GÃ¶teborg bildad 26 februari 1943</li>
            <li>Logen Capella i Halmstad 28 november 1975</li>
          </ul>
        </section>

        <section className="space-y-6 text-sm text-neutral-700">
          <h2 className="ui-section-title text-primary-600">Vad vill VS?</h2>
          <p>
            Samfundet VS vill sammanfÃ¶ra mÃ¤n av olika Ã¥ldrar, intressen och
            yrken till broderlig samvaro under vÃ¤rdiga sÃ¤llskapliga former fÃ¶r
            att slÃ¥ vakt omkring vÃ¥ra humanitÃ¤ra, ideella och kulturella
            vÃ¤rden.
          </p>

          <h2 className="ui-section-title text-primary-600">Vad kan VS erbjuda dig?</h2>
          <p>
            En afton i logen omfattar en hÃ¶gtidlig upptagning av BrÃ¶der i
            nÃ¥gon av graderna. KvÃ¤llen avslutas som regel med en brÃ¶dramÃ¥ltid
            i angenÃ¤m samvaro genom att BrÃ¶der i olika Ã¥ldrar och av skilda
            yrken och grader fÃ¥r tillfÃ¤lle till ett utbyte av tankar och
            Ã¥sikter i kanske fÃ¶r dig aktuella spÃ¶rsmÃ¥l.
          </p>

          <h2 className="ui-section-title text-primary-600">Vad Ã¤r VS?</h2>
          <p>
            Initialenerna VS bÃ¤r olika betydelse i graderna. Den slutliga
            avsÃ¶jas inte fÃ¶rrÃ¤n medlemmen recipierar i hÃ¶gsta graden. Den
            medmÃ¤nskliga livssynen Ã¤r grunden fÃ¶r Ordenssamfundets VSÂ´s etik
            och ideal. VS tvingar inga medlemmar nÃ¥gon viss
            religionsuppfattning. En broder i VS deltar med den egna tron.
          </p>
        </section>

        <section className="space-y-6 text-sm text-neutral-700">
          <h2 className="ui-section-title text-primary-600">VarfÃ¶r bara mÃ¤n?</h2>
          <p>
            I vÃ¥r tid, nÃ¤r jÃ¤mstÃ¤lldheten mellan man och kvinna Ã¤r en
            sjÃ¤lvklarhet, kan det verka egendomligt att Ordern Ã¤r Ã¶ppen endast
            fÃ¶r mÃ¤n. NÃ¤r samfundet grundades 1924 hade nÃ¥gra av grundarna den
            erfarenheten frÃ¥n andra ordenssamfund med enbart manliga medlemmar
            enligt traditioner, som gÃ¥r tillbaka till medeltiden. Ã„n idag
            fÃ¶ljer vi dessa traditioner. Detta betyder inte att
            Ordenssamfundet VS pÃ¥ nÃ¥got sÃ¤tt nedvÃ¤rderar kvinnan.
          </p>

          <h2 className="ui-section-title text-primary-600">VS Damerna</h2>
          <p>
            VÃ¥ra damer kan knytas till Ordenssamfundet genom ett medlemskap i
            Damklubben. Klubben har till syfte, fÃ¶rutom nÃ¶jet av gemensamt
            umgÃ¤nge, att genom aktivitet stÃ¶dja och frÃ¤mja arbetet inom "sin
            loge". Damklubbens i logen insatser har visat sig ha en mycket
            stor betydelse fÃ¶r logerna, och Damernas arbete har rÃ¶nt en stor
            uppskattning bland brÃ¶derna.
          </p>
        </section>
      </div>
    </PageContainer>
  );
};

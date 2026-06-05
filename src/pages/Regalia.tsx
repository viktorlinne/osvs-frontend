import { PageContainer } from "../components";

type RegaliaItem = {
    title: string;
    imageUrl: string;
    imageAlt: string;
    description?: string;
};

const grades: RegaliaItem[] = [
    {
        title: "I:a",
        imageUrl: "/achievements/grade_1.jpg",
        imageAlt: "Ordensstjärna, bärs på bröstets vänstra sida",
        description: "Bär Ordensstjärna på bröstets vänstra sida.",
    },
    {
        title: "II:a",
        imageUrl: "/achievements/grade_2.jpg",
        imageAlt: "Lyra i grönt band med brun kant, bärs om halsen",
        description: "Bär om halsen en lyra i grönt band med brun kant.",
    },
    {
        title: "III:e",
        imageUrl: "/achievements/grade_3.jpg",
        imageAlt: "Sköld med kors i svartvitt band, bärs om halsen",
        description: "Bär om halsen sköld med kors i svartvitt band.",
    },
    {
        title: "IV:e",
        imageUrl: "/achievements/grade_4.jpg",
        imageAlt: "Rött vattrat band med vidhängande triangel, bärs över höger axel",
        description: "Bär över höger axel rött vattrat band med vidhängande triangel.",
    },
    {
        title: "V:e",
        imageUrl: "/achievements/grade_5.jpg",
        imageAlt: "Grönt vattrat band med vidhängande sköld, bärs över höger axel",
        description: "Bär över höger axel grönt vattrat band med vidhängande sköld.",
    },
    {
        title: "VI:e",
        imageUrl: "/achievements/grade_6.jpg",
        imageAlt: "Ljusblått vattrat band med vidhängande svärd, bärs över höger axel",
        description: "Bär över höger axel ljusblått vattrat band med vidhängande svärd.",
    },
    {
        title: "VII:e",
        imageUrl: "/achievements/grade_7.jpg",
        imageAlt: "Rosafärgat vattrat band med sexuddig stjärna, bärs över höger axel",
        description: "Bär över höger axel rosafärgat vattrat band med sexuddig stjärna.",
    },
    {
        title: "VIII:e",
        imageUrl: "/achievements/grade_8.jpg",
        imageAlt: "Grönvitt vattrat band med vidhängande åttauddig stjärna, bärs över höger axel",
        description: "Bär över höger axel grönvitt vattrat band, vidhängande åttauddig stjärna.",
    },
    {
        title: "IX:e",
        imageUrl: "/achievements/grade_9.jpg",
        imageAlt: "Stjärna i rött vattrat band, bärs om halsen, kombineras med VIII:e gradens band",
        description: "Bär om halsen stjärna i rött vattrat band samt VIII:e gr band.",
    },
    {
        title: "X:e",
        imageUrl: "/achievements/grade_10.jpg",
        imageAlt: "Stjärna omgiven med kedja i rött vattrat band, bärs om halsen, kombineras med VIII:e gradens band",
        description: "Bär om halsen stjärna omgiven med kedja i rött vattrat band, VIII:e gr. band.",
    },
];

const honors: RegaliaItem[] = [
    {
        title: "Förtjänstmedalj",
        imageUrl: "/achievements/fortjanstmedalj.jpg",
        imageAlt: "Förtjänstmedalj",
    },
    {
        title: "Stiftarband",
        imageUrl: "/achievements/stiftarband.jpg",
        imageAlt: "Stiftarband",
    },
    {
        title: "Ordensknapp",
        imageUrl: "/achievements/ordensknapp.jpg",
        imageAlt: "Ordensknapp",
    },
    {
        title: "Jubileumsknapp",
        imageUrl: "/achievements/jubileumsknapp.jpg",
        imageAlt: "Jubileumsknapp",
    },
    {
        title: "Veteran 25 år",
        imageUrl: "/achievements/veteran_25.jpg",
        imageAlt: "Veteranmärke för 25 år i orden",
    },
];

const RegaliaCard = ({ item }: { item: RegaliaItem }) => (
    <div className="ui-card overflow-hidden p-0">
        <div className="flex h-44 items-center justify-center bg-neutral-50 p-4">
            <img
                src={item.imageUrl}
                alt={item.imageAlt}
                loading="lazy"
                className="h-full w-full object-contain"
            />
        </div>
        <div className="p-4">
            <p className="ui-chapter">{item.title}</p>
            {item.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                    {item.description}
                </p>
            )}
        </div>
    </div>
);

export const Regalia = () => {
    return (
        <PageContainer size="xl" className="ui-page">
            <h2 className="ui-page-title mb-8">Regalier</h2>

            <div className="animate-step-in">
            <section aria-labelledby="grader-heading">
                <div className="mb-5 flex items-center gap-3">
                    <h3 id="grader-heading" className="ui-chapter">Grader</h3>
                    <div className="flex-1 border-t border-neutral-200" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {grades.map((item) => (
                        <RegaliaCard key={item.title} item={item} />
                    ))}
                </div>
            </section>

            <section aria-labelledby="utmarkelser-heading" className="mt-12">
                <div className="mb-5 flex items-center gap-3">
                    <h3 id="utmarkelser-heading" className="ui-chapter">Utmärkelser</h3>
                    <div className="flex-1 border-t border-neutral-200" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {honors.map((item) => (
                        <RegaliaCard key={item.title} item={item} />
                    ))}
                </div>
            </section>
            </div>
        </PageContainer>
    );
};

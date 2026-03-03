import { PageContainer } from "../components";

type RegaliaItem = {
    title: string;
    imageUrl: string;
    description?: string;
};

const regaliaItems: RegaliaItem[] = [
    {
        title: "I:a",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_1.jpg",
        description: "Bär Ordensstjärna på bröstets vänstra sida."
    },
    {
        title: "II:a",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_2.jpg",
        description: "Bär om halsen en lyra i grönt band med brun kant."
    },
    {
        title: "III:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_3.jpg",
        description: "Bär om halsen sköld med kors i svartvitt band."
    },
    {
        title: "IV:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_4.jpg",
        description: "Bär över höger axel rött vattrat band med vidhängande triangel."
    },
    {
        title: "V:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_5.jpg",
        description: "Bär över höger axel grönt vattrat band med vidhängande sköld."
    },
    {
        title: "VI:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_6.jpg",
        description: "Bär över höger axel ljusblått vattrat band med vidhängande svärd."
    },
    {
        title: "VII:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_7.jpg",
        description: "Bär över höger axel rosafärgat vattrat band med sexuddig stjärna."
    },
    {
        title: "VIII:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_8.jpg",
        description: "Bär över höger axel grönvitt vattrat band, vidhängande åttauddig stjärna."
    },
    {
        title: "IX:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_9.jpg",
        description: "Bär om halsen stjärna i rött vattrat band samt VIII:e gr band."
    },
    {
        title: "X:e",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/grade_10.jpg",
        description: "Bär om halsen stjärna omgiven med kedja i rött vattrat band, VIII:e gr. band."
    },
    {
        title: "Förtjänstmedalj",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/fortjanstmedalj.jpg",
        description: ""
    },
    {
        title: "Stiftarband",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/stiftarband.jpg",
        description: ""
    },
    {
        title: "Ordensknapp",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/ordensknapp.jpg",
        description: ""
    },
    {
        title: "Jubileumsknapp",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/jubileumsknapp.jpg",
        description: ""
    },
    {
        title: "Veteran 25 år",
        imageUrl:
            "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/achievements/veteran_25.jpg",
        description: ""
    },
];

export const Regalia = () => {
    return (
        <PageContainer size="xl" className="ui-page">
            <h2 className="ui-page-title mb-2">Regalier</h2>
            <p className="mb-6 text-neutral-700">
                Här kan du se vilka regalier som finns inom OSVS
            </p>

            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regaliaItems.map((item) => (
                    <div
                        key={item.title}
                        className="ui-card ui-card-hover flex flex-col items-center gap-3 text-center"
                    >
                        <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                            className="h-16 w-16 rounded-md object-cover"
                        />
                        <p className="text-sm text-neutral-700">{item.description}</p>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

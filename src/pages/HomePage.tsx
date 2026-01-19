import { BannerCarousel } from "../components/";

export const HomePage = () => {
  return (
    <div className="min-h-screen" >
      <BannerCarousel />
      <div className="flex items-start justify-center py-12 px-6 ">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section>
            <h3 className="text-2xl font-semibold text-green-600">
              Ordenskalender
            </h3>
            <ul>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li className="mb-2">
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li className="mb-2">
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li className="mb-2">
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li className="mb-2">
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li className="mb-2">
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
            </ul>
          </section>
          <section>
            <h3 className="text-2xl font-semibold text-green-600">
              Ordensamfundet VS
            </h3>
            <img
              src="https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/stamlogen.jpg"
              alt="Stamlogen"
            />
          </section>
          <section>
            <h3 className="text-2xl font-semibold text-green-600">Publicum</h3>
            <ul>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
              <li>
                <p className="italic">2024-09-07</p>
                Kommande möte
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

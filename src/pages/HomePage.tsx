import { useState } from "react";
import {
  BannerCarousel,
  EventList,
  PublicumDisplay,
  PublicumList,
} from "../components/";
import type { PublicumPostListItem } from "../services/posts";

const DEFAULT_PUBLICUM = {
  title: "Ordensamfundet VS",
  imageUrl:
    "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/stamlogen.jpg",
  description: "",
};

export const HomePage = () => {
  const [displayedPublicum, setDisplayedPublicum] = useState(DEFAULT_PUBLICUM);

  const handlePublicumSelect = (post: PublicumPostListItem) => {
    setDisplayedPublicum({
      title: post.title,
      imageUrl: post.pictureUrl,
      description: post.description,
    });
  };

  return (
    <div className="min-h-screen">
      <BannerCarousel />
      <div className="flex items-start justify-center py-12 px-6 ">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section>
            <h3 className="text-2xl font-semibold text-green-600">
              Ordenskalender
            </h3>
            <EventList />
          </section>
          <PublicumDisplay
            title={displayedPublicum.title}
            imageUrl={displayedPublicum.imageUrl}
            description={displayedPublicum.description}
          />
          <section>
            <h3 className="text-2xl font-semibold text-green-600">Publicum</h3>
            <PublicumList onSelect={handlePublicumSelect} />
          </section>
        </div>
      </div>
    </div>
  );
};

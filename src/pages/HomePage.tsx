import { useState } from "react";
import {
  BannerCarousel,
  EventList,
  PageContainer,
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
    <div className="ui-page">
      <BannerCarousel />
      <PageContainer size="xl" className="pt-8 md:pt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-3">
            <h3 className="ui-section-title text-primary-600">
              Ordenskalender
            </h3>
            <EventList />
          </section>
          <PublicumDisplay
            title={displayedPublicum.title}
            imageUrl={displayedPublicum.imageUrl}
            description={displayedPublicum.description}
          />
          <section className="space-y-3">
            <h3 className="ui-section-title text-primary-600">Publicum</h3>
            <PublicumList onSelect={handlePublicumSelect} />
          </section>
        </div>
      </PageContainer>
    </div>
  );
};

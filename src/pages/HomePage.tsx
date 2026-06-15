import { useState } from "react";
import {
  EventList,
  PageContainer,
  PublicumDisplay,
  PublicumList,
} from "../components/";
import type { PublicumPostListItem } from "../services/posts";

const DEFAULT_PUBLICUM = {
  title: "Ordensamfundet VS",
  imageUrl: "/stamlogen.jpg",
  description: "",
};

export const HomePage = () => {
  const [displayedPublicum, setDisplayedPublicum] = useState(DEFAULT_PUBLICUM);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const handlePublicumSelect = (post: PublicumPostListItem) => {
    setSelectedId(post.id);
    setDisplayedPublicum({
      title: post.title,
      imageUrl: post.pictureUrl,
      description: post.description,
    });
  };

  return (
    <div className="ui-page">
      <PageContainer as="div" size="xl" className="pt-8 md:pt-10">
        <h1 className="sr-only">Ordensamfundet VS</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr_1fr]">
          <section className="space-y-3">
            <h2 className="ui-chapter">Ordenskalender</h2>
            <EventList />
          </section>
          <PublicumDisplay
            title={displayedPublicum.title}
            imageUrl={displayedPublicum.imageUrl}
            description={displayedPublicum.description}
          />
          <section className="space-y-3">
            <h2 className="ui-chapter">Publicum</h2>
            <PublicumList selectedId={selectedId} onSelect={handlePublicumSelect} />
          </section>
        </div>
      </PageContainer>
    </div>
  );
};

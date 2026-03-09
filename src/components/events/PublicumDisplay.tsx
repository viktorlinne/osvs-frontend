type PublicumDisplayProps = {
  title: string;
  imageUrl: string;
  description: string;
};

export function PublicumDisplay({
  title,
  imageUrl,
  description,
}: PublicumDisplayProps) {
  return (
    <section className="ui-card">
      <h3 className="ui-section-title mb-3 text-primary-600">{title}</h3>
      <img
        src={imageUrl}
        alt={title}
        className="mb-3 h-56 w-full rounded-md object-cover md:h-64"
      />
      <p className="text-sm text-neutral-700 md:text-base">{description}</p>
    </section>
  );
}

export default PublicumDisplay;

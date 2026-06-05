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
    <section>
      <h2 className="ui-section-title mb-3 border-b border-neutral-200 pb-3">{title}</h2>
      <img
        src={imageUrl}
        alt={title}
        className="mb-3 h-56 w-full rounded-md object-cover md:h-64"
      />
      {description && (
        <p className="text-sm text-neutral-700 md:text-base">{description}</p>
      )}
    </section>
  );
}

export default PublicumDisplay;

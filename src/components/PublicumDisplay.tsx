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
      <h3 className="text-2xl font-semibold text-green-600">{title}</h3>
      <img src={imageUrl} alt={title} />
      <p>{description}</p>
    </section>
  );
}

export default PublicumDisplay;

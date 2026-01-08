export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-3xl mb-4">404</h2>
      <p className="mb-4">Sidan hittades inte</p>
      <a
        href="/"
        className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-sm font-medium transition text-white"
      >
        Tillbaka till startsidan
      </a>
    </div>
  );
};

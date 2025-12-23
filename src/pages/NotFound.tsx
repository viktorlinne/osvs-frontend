export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-3xl mb-4">404</h2>
      <p className="mb-4">Page Not Found</p>
      <a
        href="/"
        className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white transition"
      >
        Go to Home
      </a>
    </div>
  );
};

export const Banner = () => {
  return (
    <div className="w-full flex flex-col bg-gray-100 py-2 px-4 text-center text-sm text-green-600">
      <img src="https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/banner.png" 
            alt="Ordenssamfundet VS Logo" 
            className="mx-auto object-contain"
        />
      <h1 className="text-xl font-bold">ORDENSAMFUNDET VS</h1>
    </div>
  );
};

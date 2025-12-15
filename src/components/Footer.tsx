export const Footer = () => {
  return (
    <footer className="flex justify-center gap-4 p-4 bg-gray-100 ">
      <p>
        &copy; {new Date().getFullYear()}
      </p>
      <p>
        Ordensamfundet VS
      </p>
      <a href="mailto:info@osvs.se" className="hover:underline">
        info@osvs.se
      </a>
      <a href="http://www.osvs.se" className="hover:underline">
        http://www.osvs.se
      </a>
    </footer>
  );
};

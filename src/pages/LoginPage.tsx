import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setError, clearError } = useError();
  const { run } = useFetch();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const user = await run(() => login(email, password));
      if (user) navigate("/news");
      else setError("Login failed");
    } catch {
      // useFetch already sets friendly messages via global error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={submit}
        className="max-w-md w-full bg-white p-6 rounded shadow"
      >
        <h2 className="text-2xl font-bold mb-4">Logga in</h2>
        {/* top-level errors shown by ErrorProvider */}
        <label className="block mb-2">
          <div className="text-sm">Email</div>
          <input
            className="border px-4 py-2 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="block mb-4">
          <div className="text-sm">Lösenord</div>
          <input
            className="border px-4 py-2 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition text-white "
          disabled={loading}
        >
          {loading ? "Loggar in..." : "Logga in"}
        </button>
      </form>
    </div>
  );
};

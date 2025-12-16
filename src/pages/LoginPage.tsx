import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={submit} className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <label className="block mb-2">
          <div className="text-sm">Email</div>
          <input
            className="border p-2 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="block mb-4">
          <div className="text-sm">Password</div>
          <input
            className="border p-2 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white "
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

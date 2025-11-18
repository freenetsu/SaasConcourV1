import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si un user est déjà connecté au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Nettoyer les espaces
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      console.log("Tentative de connexion avec:", cleanEmail);

      // Pour l'instant, on simule une connexion simple
      // TODO: Remplacer par un vrai appel API

      // Simulation: vérifier avec les données de test
      const testUsers = [
        {
          id: "1",
          email: "admin@saasconcour.com",
          password: "password123",
          name: "Admin Principal",
          role: "ADMIN" as const,
        },
        {
          id: "2",
          email: "marie@saasconcour.com",
          password: "password123",
          name: "Marie Dupont",
          role: "USER" as const,
        },
        {
          id: "3",
          email: "sophie@saasconcour.com",
          password: "password123",
          name: "Sophie Bernard",
          role: "USER" as const,
        },
        {
          id: "4",
          email: "thomas@saasconcour.com",
          password: "password123",
          name: "Thomas Leroy",
          role: "USER" as const,
        },
      ];

      const foundUser = testUsers.find(
        (u) => u.email === cleanEmail && u.password === cleanPassword
      );

      if (!foundUser) {
        console.log("Utilisateur non trouvé");
        throw new Error("Email ou mot de passe incorrect");
      }

      console.log("Utilisateur trouvé:", foundUser.name);

      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Pour l'instant, on simule une inscription simple
      // TODO: Remplacer par un vrai appel API
      console.log("Registering user with password:", password.length, "chars");

      const newUser = {
        id: Date.now().toString(),
        email,
        name,
        role: "USER" as const,
      };

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

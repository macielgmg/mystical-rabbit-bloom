import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { BookOpen, Book, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";

const Layout = () => {
  const { hasNewStudyNotification, setNewStudyNotification } = useSession();
  const location = useLocation();

  const hideFooterPaths = [
    "/today/spiritual-journal",
    "/today/verse-of-the-day",
    "/today/daily-study",
    "/today/quick-reflection", // Novo caminho adicionado
    "/today/inspirational-quote", // Novo caminho adicionado
    "/today/my-prayer", // Novo caminho adicionado
  ];

  const shouldHideFooter = hideFooterPaths.includes(location.pathname);

  // Define o padding inferior do main com base na visibilidade do footer
  const mainPaddingClass = shouldHideFooter ? "pb-4" : "pb-24";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex flex-col items-center gap-1 p-2 rounded-md text-xs font-medium transition-colors flex-1 relative",
      isActive
        ? "text-primary"
        : "text-muted-foreground hover:text-primary",
    );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className={cn("flex-1 bg-secondary/40 pt-6", mainPaddingClass)}> {/* Aplica o padding condicional aqui */}
        <Outlet />
      </main>

      {!shouldHideFooter && (
        <footer className="fixed bottom-0 left-0 right-0 border-t bg-card z-10">
          <nav className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
            <NavLink 
              to="/library"
              className={navLinkClass}
              onClick={() => setNewStudyNotification(false)}
            >
              <BookOpen className="h-5 w-5" />
              Estudos
              {hasNewStudyNotification && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
              )}
            </NavLink>
            <NavLink to="/store" className={navLinkClass}>
              <Book className="h-5 w-5" />
              Descobrir
            </NavLink>
            <NavLink to="/today" className={navLinkClass}>
              <Calendar className="h-5 w-5" />
              Hoje
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              <User className="h-5 w-5" />
              Perfil
            </NavLink>
          </nav>
        </footer>
      )}
    </div>
  );
};

export default Layout;
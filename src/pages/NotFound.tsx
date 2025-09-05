import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold text-primary">404</h1>
      <p className="text-xl text-muted-foreground">Página não encontrada</p>
      <Button onClick={() => navigate("/")}>
        Voltar para a página inicial
      </Button>
    </div>
  );
};

export default NotFound;
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center bg-[var(--color-bg)]">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 animate-fade-in-up">
        Bem-vindo ao NOVA
      </h1>
      <p className="text-[var(--color-text-dim)] max-w-md mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        Organize seu dinheiro, acompanhe seus objetivos e tome decisões financeiras melhores.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Button onClick={() => navigate('/signup')}>Começar</Button>
        <Button variant="ghost" onClick={() => navigate('/login')}>
          Já tenho conta
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { User } from '../types';
import { storage } from '../utils/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Mail, Award, Lock, AlertCircle, HelpCircle, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get login content from system config
  const config = storage.getSystemConfig();
  const { title, subtitle, description, helpEmail } = config.loginContent;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simular delay de autenticación
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = storage.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Allow superadmin to login without corporate email validation
    if (user && user.role === 'superadmin') {
      storage.ensureMonthlyAllocation(user.id);
      onLogin(user);
      return;
    }

    // Regular users must use corporate email
    if (!email.endsWith('@grupoprominente.com')) {
      setError('Debes usar tu correo corporativo (@grupoprominente.com)');
      setIsLoading(false);
      return;
    }

    if (!user) {
      setError('Usuario no encontrado en la nómina. Contacta a People & Culture para obtener acceso.');
      setIsLoading(false);
      return;
    }

    storage.ensureMonthlyAllocation(user.id);
    onLogin(user);
  };

  const handleDemoLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setError('');
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const users = storage.getUsers();
    const user = users.find(u => u.email === userEmail);
    if (user) {
      storage.ensureMonthlyAllocation(user.id);
      onLogin(user);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md shadow-xl border-2">
            <CardHeader className="text-center space-y-6 pb-8">
              <motion.div 
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-4 shadow-lg">
                  <Award className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              <div>
                <CardTitle className="text-3xl mb-2">{title}</CardTitle>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <CardDescription>
                    {description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Correo Corporativo</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Usa tu correo corporativo de Grupo Prominente para acceder.
                          Solo colaboradores registrados en nómina tienen acceso.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu.nombre@grupoprominente.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="pl-10 h-12 border-2 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                      aria-describedby={error ? "email-error" : undefined}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" id="email-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 shadow-md hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-3 text-muted-foreground">
                      Demo - Usuarios de prueba
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDemoLogin('admin@sistema.local')}
                    className="w-full justify-start h-12 hover:bg-accent hover:border-amber-500/30 transition-all group"
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="bg-amber-500/10 rounded-full p-2 group-hover:bg-amber-500/20 transition-colors">
                        <Lock className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">Admin Sistema</p>
                        <p className="text-xs text-muted-foreground">SuperAdmin - Configuración Total</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDemoLogin('maria.garcia@grupoprominente.com')}
                    className="w-full justify-start h-12 hover:bg-accent hover:border-primary/30 transition-all group"
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="bg-primary/10 rounded-full p-2 group-hover:bg-primary/20 transition-colors">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">María García</p>
                        <p className="text-xs text-muted-foreground">Colaborador - Desarrollo</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDemoLogin('ana.rodriguez@grupoprominente.com')}
                    className="w-full justify-start h-12 hover:bg-accent hover:border-secondary/30 transition-all group"
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="bg-secondary/10 rounded-full p-2 group-hover:bg-secondary/20 transition-colors">
                        <Award className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">Ana Rodríguez</p>
                        <p className="text-xs text-muted-foreground">People & Culture - Solo Reportes</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                <p>¿Necesitas ayuda? Contacta a 
                  <span className="text-primary ml-1 cursor-pointer hover:underline">
                    {helpEmail}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
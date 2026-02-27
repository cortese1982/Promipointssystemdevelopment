import { useState, useEffect } from 'react';
import { User, PointAssignment } from '../types';
import { storage, getCurrentMonth } from '../utils/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Gift, Search, X, CheckCircle2, AlertCircle, Info, User as UserIcon, Building2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

interface AssignPointsProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Trabajo en equipo': 'Colabora efectivamente con sus compañeros',
  'Innovación': 'Propone ideas creativas y soluciones nuevas',
  'Liderazgo': 'Inspira y guía al equipo hacia el éxito',
  'Colaboración': 'Apoya activamente a otros departamentos',
  'Compromiso': 'Demuestra dedicación y responsabilidad',
  'Excelencia': 'Supera expectativas constantemente',
  'Actitud positiva': 'Mantiene energía positiva en el equipo',
  'Comunicación efectiva': 'Comunica claramente y escucha activamente',
};

export function AssignPoints({ currentUser, onClose, onSuccess }: AssignPointsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [points, setPoints] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [message, setMessage] = useState('');
  const [availablePoints, setAvailablePoints] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get enabled categories from system config
  const systemConfig = storage.getSystemConfig();
  const enabledCategories = systemConfig.categories.filter(cat => cat.enabled);

  useEffect(() => {
    const allUsers = storage.getUsers();
    const otherUsers = allUsers.filter(u => u.id !== currentUser.id);
    setUsers(otherUsers);

    const month = getCurrentMonth();
    const allocation = storage.getUserAllocation(currentUser.id, month);
    setAvailablePoints(allocation?.pointsRemaining || 0);
  }, [currentUser.id]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedUser) {
      newErrors.user = 'Debes seleccionar un colaborador';
    }

    if (!category) {
      newErrors.category = 'Debes seleccionar una categoría';
    }

    if (points > availablePoints) {
      newErrors.points = `Solo tienes ${availablePoints} puntos disponibles`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser || !category) return;

    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const month = getCurrentMonth();
    
    const assignment: PointAssignment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromUserId: currentUser.id,
      toUserId: selectedUser.id,
      points,
      category,
      message: message.trim() || undefined,
      timestamp: Date.now(),
      month,
    };

    storage.addAssignment(assignment);

    const senderAllocation = storage.getUserAllocation(currentUser.id, month);
    if (senderAllocation) {
      senderAllocation.pointsRemaining -= points;
      storage.updateAllocation(senderAllocation);
    }

    const receiverAllocation = storage.getUserAllocation(selectedUser.id, month);
    if (receiverAllocation) {
      receiverAllocation.pointsReceived += points;
      storage.updateAllocation(receiverAllocation);
    }

    toast.success(
      `¡Reconocimiento enviado!`,
      {
        description: `${points} PromiPoint${points > 1 ? 's' : ''} asignado${points > 1 ? 's' : ''} a ${selectedUser.name}`,
        duration: 4000,
      }
    );
    
    onSuccess();
  };

  const handleBack = () => {
    setShowConfirmation(false);
  };

  return (
    <TooltipProvider>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-1.5 sm:p-2">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                Asignar PromiPoints
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 sm:hidden"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <DialogDescription className="text-sm">
                Reconoce el trabajo excepcional
              </DialogDescription>
              <span className="text-primary font-semibold text-sm">
                {availablePoints} puntos disponibles
              </span>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {!showConfirmation ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 sm:space-y-6"
              >
                {!selectedUser ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Buscar colaborador</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Nombre, correo o departamento..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setErrors({});
                          }}
                          className="pl-10 h-11 sm:h-12"
                          autoFocus
                        />
                      </div>
                      {errors.user && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.user}
                        </p>
                      )}
                    </div>

                    <div className="border rounded-lg divide-y max-h-[50vh] sm:max-h-[300px] overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center text-muted-foreground">
                          <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm sm:text-base">No se encontraron colaboradores</p>
                          <p className="text-xs sm:text-sm mt-1">Intenta con otro término</p>
                        </div>
                      ) : (
                        filteredUsers.map(user => (
                          <motion.button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setErrors({});
                            }}
                            className="w-full p-3 sm:p-4 text-left hover:bg-accent transition-colors group"
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="bg-primary/10 rounded-full p-1.5 sm:p-2 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{user.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                  <Building2 className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{user.department}</span>
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Selected User */}
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border-2 border-primary/20">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="bg-primary/20 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{selectedUser.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{selectedUser.department}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(null);
                          setSearchTerm('');
                        }}
                        className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Points Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="points" className="text-sm sm:text-base">Cantidad de puntos *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Selecciona cuántos puntos quieres asignar</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {[1, 2, 3, 5].map(value => (
                          <motion.button
                            key={value}
                            type="button"
                            onClick={() => {
                              setPoints(value);
                              setErrors({});
                            }}
                            disabled={value > availablePoints}
                            className={`py-3 sm:py-4 rounded-lg border-2 transition-all ${
                              points === value
                                ? 'border-primary bg-primary text-white shadow-md scale-105'
                                : 'border-border hover:border-primary/50 bg-card'
                            } ${
                              value > availablePoints
                                ? 'opacity-30 cursor-not-allowed'
                                : 'cursor-pointer hover:shadow-md active:scale-95'
                            }`}
                            whileHover={value <= availablePoints ? { scale: 1.05 } : {}}
                            whileTap={value <= availablePoints ? { scale: 0.95 } : {}}
                          >
                            <div className="text-2xl sm:text-3xl font-semibold">{value}</div>
                            <div className="text-xs opacity-80 mt-1">
                              {value === 1 ? 'punto' : 'puntos'}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      
                      {errors.points && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.points}
                        </p>
                      )}
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="category" className="text-sm sm:text-base">Categoría *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Valor organizacional que representa este reconocimiento</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <Select value={category} onValueChange={(value) => {
                        setCategory(value);
                        setErrors({});
                      }}>
                        <SelectTrigger id="category" className="h-11 sm:h-12">
                          <SelectValue placeholder="Selecciona un valor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {enabledCategories.map(cat => (
                            <SelectItem key={cat.name} value={cat.name} className="py-3">
                              <div>
                                <p className="font-medium text-sm sm:text-base">{cat.name}</p>
                                <p className="text-xs text-muted-foreground hidden sm:block">{CATEGORY_DESCRIPTIONS[cat.name]}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {errors.category && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    {/* Optional Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm sm:text-base">
                        Mensaje (opcional)
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Ej: Tu dedicación en el proyecto fue excepcional..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        maxLength={200}
                        className="resize-none text-sm sm:text-base"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="hidden sm:inline">Agrega un mensaje personal</span>
                        <span>{message.length}/200</span>
                      </div>
                    </div>

                    {/* Privacy Notice */}
                    <Alert className="border-primary/20 bg-primary/5">
                      <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      <AlertDescription className="ml-2 text-xs sm:text-sm">
                        <span className="font-semibold">Anónimo:</span> {selectedUser.name} no sabrá quién lo envió
                      </AlertDescription>
                    </Alert>

                    {/* Actions */}
                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose} 
                        className="flex-1 h-11 sm:h-12"
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handlePreview}
                        className="flex-1 bg-secondary hover:bg-secondary/90 shadow-md h-11 sm:h-12"
                        disabled={!category || availablePoints === 0 || isSubmitting}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Revisar
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="text-center py-4 sm:py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-block bg-gradient-to-br from-primary to-secondary rounded-full p-4 sm:p-6 mb-4 sm:mb-6"
                  >
                    <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </motion.div>
                  
                  <h3 className="text-xl sm:text-2xl mb-2">Confirma tu reconocimiento</h3>
                  <p className="text-sm sm:text-base text-muted-foreground px-4">
                    Revisa los detalles antes de enviar
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-accent to-muted p-4 sm:p-6 rounded-lg border-2">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm text-muted-foreground">Para</span>
                    <div className="text-right">
                      <p className="font-semibold text-sm sm:text-base">{selectedUser?.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{selectedUser?.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm text-muted-foreground">Puntos</span>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl sm:text-3xl text-secondary font-semibold">{points}</div>
                      <span className="text-sm text-muted-foreground">PromiPoint{points > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm text-muted-foreground">Categoría</span>
                    <div className="text-right">
                      <p className="font-semibold text-sm sm:text-base">{category}</p>
                    </div>
                  </div>

                  {message && (
                    <div className="pt-3">
                      <p className="text-sm text-muted-foreground mb-2">Mensaje</p>
                      <p className="text-sm sm:text-base italic bg-background/50 p-3 rounded">"{message}"</p>
                    </div>
                  )}
                </div>

                <Alert className="border-primary/20 bg-primary/5">
                  <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  <AlertDescription className="ml-2 text-xs sm:text-sm">
                    Este reconocimiento es anónimo. {selectedUser?.name} no sabrá que viene de ti.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                    className="flex-1 h-11 sm:h-12"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 bg-secondary hover:bg-secondary/90 shadow-md h-11 sm:h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Confirmar
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
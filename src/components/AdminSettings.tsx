import { useState } from 'react';
import { SystemConfig, User, OnboardingStep, EmailNotificationConfig } from '../types';
import { storage, getCurrentMonth } from '../utils/storage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Settings, Plus, X, RotateCcw, AlertTriangle, Info, Mail, FileText, Tag, BookOpen, Bell, Trash2, Server } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

interface AdminSettingsProps {
  onUpdate?: () => void;
}

const MAX_ONBOARDING_STEPS = 5;

export function AdminSettings({ onUpdate }: AdminSettingsProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<SystemConfig>(storage.getSystemConfig());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [resetType, setResetType] = useState<'partial' | 'total'>('partial');
  const [newPeopleEmail, setNewPeopleEmail] = useState('');

  const users = storage.getUsers().filter(u => u.role === 'employee');
  
  // Ensure onboardingSteps exists
  const onboardingSteps = config.onboardingSteps || [];

  const handleToggleCategory = (categoryName: string) => {
    const updatedCategories = config.categories.map(cat =>
      cat.name === categoryName ? { ...cat, enabled: !cat.enabled } : cat
    );
    const updatedConfig = { ...config, categories: updatedCategories };
    setConfig(updatedConfig);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Ingresa un nombre para la categoría');
      return;
    }

    if (config.categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      toast.error('Ya existe una categoría con ese nombre');
      return;
    }

    const updatedCategories = [...config.categories, { name: newCategoryName.trim(), enabled: true }];
    const updatedConfig = { ...config, categories: updatedCategories };
    setConfig(updatedConfig);
    setNewCategoryName('');
    toast.success('Categoría agregada exitosamente');
  };

  const handleRemoveCategory = (categoryName: string) => {
    const updatedCategories = config.categories.filter(cat => cat.name !== categoryName);
    const updatedConfig = { ...config, categories: updatedCategories };
    setConfig(updatedConfig);
    toast.success('Categoría eliminada');
  };

  const handleUpdateLoginContent = (field: keyof SystemConfig['loginContent'], value: string) => {
    const updatedConfig = {
      ...config,
      loginContent: { ...config.loginContent, [field]: value },
    };
    setConfig(updatedConfig);
  };

  const handleUpdateOnboardingStep = (index: number, field: keyof OnboardingStep, value: string) => {
    const updatedSteps = [...config.onboardingSteps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    const updatedConfig = { ...config, onboardingSteps: updatedSteps };
    setConfig(updatedConfig);
  };

  const handleAddOnboardingStep = () => {
    if (config.onboardingSteps.length >= MAX_ONBOARDING_STEPS) {
      toast.error(`Máximo ${MAX_ONBOARDING_STEPS} pasos permitidos`);
      return;
    }

    const newStep: OnboardingStep = {
      title: 'Nuevo Paso',
      description: 'Descripción del paso',
      details: 'Información detallada del paso',
    };

    const updatedConfig = {
      ...config,
      onboardingSteps: [...config.onboardingSteps, newStep],
    };
    setConfig(updatedConfig);
    toast.success('Paso agregado');
  };

  const handleRemoveOnboardingStep = (index: number) => {
    if (config.onboardingSteps.length <= 1) {
      toast.error('Debe haber al menos un paso');
      return;
    }

    const updatedSteps = config.onboardingSteps.filter((_, i) => i !== index);
    const updatedConfig = { ...config, onboardingSteps: updatedSteps };
    setConfig(updatedConfig);
    toast.success('Paso eliminado');
  };

  const handleUpdateEmailConfig = (field: keyof EmailNotificationConfig, value: any) => {
    const updatedConfig = {
      ...config,
      emailNotifications: { ...config.emailNotifications, [field]: value },
    };
    setConfig(updatedConfig);
  };

  const handleAddPeopleEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPeopleEmail)) {
      toast.error('Email inválido');
      return;
    }

    if (config.emailNotifications.peopleEmails.includes(newPeopleEmail)) {
      toast.error('Este email ya está en la lista');
      return;
    }

    const updatedEmails = [...config.emailNotifications.peopleEmails, newPeopleEmail];
    handleUpdateEmailConfig('peopleEmails', updatedEmails);
    setNewPeopleEmail('');
    toast.success('Email agregado');
  };

  const handleRemovePeopleEmail = (email: string) => {
    const updatedEmails = config.emailNotifications.peopleEmails.filter(e => e !== email);
    handleUpdateEmailConfig('peopleEmails', updatedEmails);
    toast.success('Email eliminado');
  };

  const handleResetPoints = () => {
    if (selectedUsers.length === 0) {
      toast.error('Selecciona al menos un colaborador');
      return;
    }

    const month = getCurrentMonth();
    const allocations = storage.getAllocations();
    const assignments = storage.getAssignments();

    selectedUsers.forEach(userId => {
      const allocation = allocations.find(a => a.userId === userId && a.month === month);
      
      if (allocation) {
        if (resetType === 'total') {
          allocation.pointsRemaining = 10;
          allocation.pointsReceived = 0;
        } else {
          allocation.pointsReceived = 0;
        }
        storage.updateAllocation(allocation);
      }
    });

    if (resetType === 'total') {
      const filteredAssignments = assignments.filter(a => 
        a.month !== month || (!selectedUsers.includes(a.toUserId) && !selectedUsers.includes(a.fromUserId))
      );
      storage.setAssignments(filteredAssignments);
    }

    toast.success(`Puntos ${resetType === 'total' ? 'totales' : 'recibidos'} reseteados para ${selectedUsers.length} usuario(s)`);
    setSelectedUsers([]);
    onUpdate?.();
  };

  const handleSaveConfig = () => {
    const enabledCategories = config.categories.filter(cat => cat.enabled);
    
    if (enabledCategories.length === 0) {
      toast.error('Debe haber al menos una categoría activa');
      return;
    }

    if (config.onboardingSteps.length === 0) {
      toast.error('Debe haber al menos un paso de onboarding');
      return;
    }

    storage.setSystemConfig(config);
    toast.success('Configuración guardada exitosamente');
    setOpen(false);
    onUpdate?.();
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSMTPProviderChange = (provider: EmailNotificationConfig['smtpProvider']) => {
    handleUpdateEmailConfig('smtpProvider', provider);
    
    // Set default SMTP settings based on provider
    switch (provider) {
      case 'gmail':
        handleUpdateEmailConfig('smtpHost', 'smtp.gmail.com');
        handleUpdateEmailConfig('smtpPort', 587);
        break;
      case 'outlook':
        handleUpdateEmailConfig('smtpHost', 'smtp.office365.com');
        handleUpdateEmailConfig('smtpPort', 587);
        break;
      case 'sendgrid':
        handleUpdateEmailConfig('smtpHost', 'smtp.sendgrid.net');
        handleUpdateEmailConfig('smtpPort', 587);
        break;
      case 'custom':
        // Keep current values for custom
        break;
    }
  };

  const enabledCount = config.categories.filter(cat => cat.enabled).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configuración
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Sistema
          </DialogTitle>
          <DialogDescription>
            Administra categorías, onboarding, notificaciones, contenido de login y reseteo de puntos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="categories" className="mt-4">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="categories" className="flex flex-col sm:flex-row gap-1 py-2">
              <Tag className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Categorías</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex flex-col sm:flex-row gap-1 py-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Tutorial</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col sm:flex-row gap-1 py-2">
              <Bell className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="login" className="flex flex-col sm:flex-row gap-1 py-2">
              <Mail className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Login</span>
            </TabsTrigger>
            <TabsTrigger value="reset" className="flex flex-col sm:flex-row gap-1 py-2">
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Reset</span>
            </TabsTrigger>
          </TabsList>

          {/* Categorías */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestión de Categorías</CardTitle>
                <CardDescription>
                  Activa, desactiva o administra las categorías de reconocimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Las categorías desactivadas no aparecerán al asignar puntos. 
                    Categorías activas: <strong>{enabledCount}</strong> de <strong>{config.categories.length}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {config.categories.map((category, index) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          category.enabled 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Switch
                            checked={category.enabled}
                            onCheckedChange={() => handleToggleCategory(category.name)}
                          />
                          <div>
                            <p className={`font-medium ${!category.enabled && 'text-muted-foreground'}`}>
                              {category.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {category.enabled ? 'Activa' : 'Desactivada'}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCategory(category.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Agregar Nueva Categoría</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: Responsabilidad social"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button onClick={handleAddCategory}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onboarding */}
          <TabsContent value="onboarding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenido de Onboarding</CardTitle>
                <CardDescription>
                  Personaliza las pantallas que ven los nuevos usuarios al ingresar por primera vez
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Edita el contenido de cada paso del tutorial inicial. 
                    Hay {config.onboardingSteps.length} de máximo {MAX_ONBOARDING_STEPS} pasos.
                  </AlertDescription>
                </Alert>

                <AnimatePresence mode="popLayout">
                  {config.onboardingSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border-2 rounded-lg space-y-4 bg-accent/30"
                    >
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <h4 className="font-semibold">Paso {index + 1}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOnboardingStep(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={config.onboardingSteps.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-title`}>Título</Label>
                        <Input
                          id={`step-${index}-title`}
                          value={step.title}
                          onChange={(e) => handleUpdateOnboardingStep(index, 'title', e.target.value)}
                          placeholder="Ej: ¡Bienvenido a PromiPoints!"
                          maxLength={50}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-description`}>Descripción</Label>
                        <Input
                          id={`step-${index}-description`}
                          value={step.description}
                          onChange={(e) => handleUpdateOnboardingStep(index, 'description', e.target.value)}
                          placeholder="Descripción breve del paso"
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-details`}>Detalles</Label>
                        <Textarea
                          id={`step-${index}-details`}
                          value={step.details}
                          onChange={(e) => handleUpdateOnboardingStep(index, 'details', e.target.value)}
                          placeholder="Información adicional y explicación detallada"
                          rows={3}
                          maxLength={250}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {step.details.length}/250
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button
                  onClick={handleAddOnboardingStep}
                  variant="outline"
                  className="w-full"
                  disabled={config.onboardingSteps.length >= MAX_ONBOARDING_STEPS}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Paso ({config.onboardingSteps.length}/{MAX_ONBOARDING_STEPS})
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificaciones por Email */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración de Notificaciones</CardTitle>
                <CardDescription>
                  Configura el envío de notificaciones por email cuando se asignan puntos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nota:</strong> Esta es una funcionalidad de frontend únicamente. 
                    Los emails NO se enviarán realmente. Necesitarás integrar un backend 
                    con un servicio de email (SendGrid, Mailgun, etc.) para envíos reales.
                  </AlertDescription>
                </Alert>

                {/* Activar/Desactivar Notificaciones */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/30">
                  <div className="space-y-1">
                    <Label htmlFor="notifications-enabled" className="text-base font-semibold">
                      Activar Notificaciones por Email
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Habilita el envío de notificaciones automáticas
                    </p>
                  </div>
                  <Switch
                    id="notifications-enabled"
                    checked={config.emailNotifications.enabled}
                    onCheckedChange={(checked) => handleUpdateEmailConfig('enabled', checked)}
                  />
                </div>

                <Separator />

                {/* Opciones de Notificación */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    ¿Quién recibe notificaciones?
                  </h4>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="notify-employee" className="font-medium">
                        Notificar al Colaborador
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        El colaborador recibe un email cuando le asignan puntos
                      </p>
                    </div>
                    <Switch
                      id="notify-employee"
                      checked={config.emailNotifications.notifyEmployee}
                      onCheckedChange={(checked) => handleUpdateEmailConfig('notifyEmployee', checked)}
                      disabled={!config.emailNotifications.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="notify-people" className="font-medium">
                        Notificar al Equipo de People
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        El equipo de People recibe copia de cada asignación
                      </p>
                    </div>
                    <Switch
                      id="notify-people"
                      checked={config.emailNotifications.notifyPeople}
                      onCheckedChange={(checked) => handleUpdateEmailConfig('notifyPeople', checked)}
                      disabled={!config.emailNotifications.enabled}
                    />
                  </div>

                  {config.emailNotifications.notifyPeople && (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <Label>Emails del Equipo de People</Label>
                      
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="people@grupoprominente.com"
                          value={newPeopleEmail}
                          onChange={(e) => setNewPeopleEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddPeopleEmail()}
                        />
                        <Button onClick={handleAddPeopleEmail} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </div>

                      {config.emailNotifications.peopleEmails.length > 0 ? (
                        <div className="space-y-2">
                          {config.emailNotifications.peopleEmails.map((email, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex items-center justify-between p-2 bg-background border rounded"
                            >
                              <span className="text-sm">{email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePeopleEmail(email)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay emails configurados
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Configuración del Servidor SMTP */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Configuración del Servidor de Email
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-provider">Proveedor de Email</Label>
                    <Select
                      value={config.emailNotifications.smtpProvider}
                      onValueChange={handleSMTPProviderChange}
                      disabled={!config.emailNotifications.enabled}
                    >
                      <SelectTrigger id="smtp-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gmail">Gmail / Google Workspace</SelectItem>
                        <SelectItem value="outlook">Outlook / Microsoft 365</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">Servidor SMTP</Label>
                      <Input
                        id="smtp-host"
                        value={config.emailNotifications.smtpHost}
                        onChange={(e) => handleUpdateEmailConfig('smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                        disabled={!config.emailNotifications.enabled || config.emailNotifications.smtpProvider !== 'custom'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Puerto</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={config.emailNotifications.smtpPort}
                        onChange={(e) => handleUpdateEmailConfig('smtpPort', parseInt(e.target.value))}
                        placeholder="587"
                        disabled={!config.emailNotifications.enabled || config.emailNotifications.smtpProvider !== 'custom'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Usuario / Email del Servidor</Label>
                    <Input
                      id="smtp-user"
                      type="email"
                      value={config.emailNotifications.smtpUser}
                      onChange={(e) => handleUpdateEmailConfig('smtpUser', e.target.value)}
                      placeholder="tu-email@gmail.com"
                      disabled={!config.emailNotifications.enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Contraseña / API Key</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={config.emailNotifications.smtpPassword}
                      onChange={(e) => handleUpdateEmailConfig('smtpPassword', e.target.value)}
                      placeholder="••••••••••••••••"
                      disabled={!config.emailNotifications.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Para Gmail, usa una contraseña de aplicación. Para SendGrid, usa tu API Key.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="from-email">Email Remitente</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={config.emailNotifications.fromEmail}
                      onChange={(e) => handleUpdateEmailConfig('fromEmail', e.target.value)}
                      placeholder="noreply@grupoprominente.com"
                      disabled={!config.emailNotifications.enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-name">Nombre del Remitente</Label>
                    <Input
                      id="from-name"
                      value={config.emailNotifications.fromName}
                      onChange={(e) => handleUpdateEmailConfig('fromName', e.target.value)}
                      placeholder="PromiPoints - Grupo Prominente"
                      disabled={!config.emailNotifications.enabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido Login */}
          <TabsContent value="login" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenido de Inicio de Sesión</CardTitle>
                <CardDescription>
                  Personaliza la información que se muestra en la pantalla de login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título Principal</Label>
                  <Input
                    id="title"
                    value={config.loginContent.title}
                    onChange={(e) => handleUpdateLoginContent('title', e.target.value)}
                    placeholder="PromiPoints"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo (Empresa)</Label>
                  <Input
                    id="subtitle"
                    value={config.loginContent.subtitle}
                    onChange={(e) => handleUpdateLoginContent('subtitle', e.target.value)}
                    placeholder="Grupo Prominente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={config.loginContent.description}
                    onChange={(e) => handleUpdateLoginContent('description', e.target.value)}
                    placeholder="Sistema de reconocimiento de Grupo Prominente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="helpEmail">Email de Ayuda</Label>
                  <Input
                    id="helpEmail"
                    type="email"
                    value={config.loginContent.helpEmail}
                    onChange={(e) => handleUpdateLoginContent('helpEmail', e.target.value)}
                    placeholder="people@grupoprominente.com"
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Los cambios se reflejarán inmediatamente en la pantalla de inicio de sesión
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resetear Puntos */}
          <TabsContent value="reset" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resetear Puntos de Colaboradores</CardTitle>
                <CardDescription>
                  Restaura puntos recibidos o totales de usuarios seleccionados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>¡Cuidado!</strong> Esta acción no se puede deshacer. El reseteo total elimina 
                    todas las asignaciones del mes actual para los usuarios seleccionados.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Tipo de Reseteo</Label>
                    <Select value={resetType} onValueChange={(v) => setResetType(v as 'partial' | 'total')}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partial">
                          Parcial (solo puntos recibidos)
                        </SelectItem>
                        <SelectItem value="total">
                          Total (recibidos + dados)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm font-medium">
                      {resetType === 'partial' ? 'Reseteo Parcial' : 'Reseteo Total'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {resetType === 'partial' 
                        ? 'Solo resetea los puntos recibidos. Los puntos dados por el usuario se mantienen.'
                        : 'Resetea puntos recibidos, devuelve 10 puntos para dar, y elimina todas las asignaciones del mes.'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Seleccionar Colaboradores</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSelectAllUsers}
                    >
                      {selectedUsers.length === users.length ? 'Deseleccionar' : 'Seleccionar'} Todos
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                    {users.map(user => {
                      const isSelected = selectedUsers.includes(user.id);
                      const allocation = storage.getUserAllocation(user.id, getCurrentMonth());
                      
                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUsers(prev =>
                              prev.includes(user.id)
                                ? prev.filter(id => id !== user.id)
                                : [...prev, user.id]
                            );
                          }}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-primary/10 border-primary' 
                              : 'border-border hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.department}</p>
                            </div>
                            <Badge variant={isSelected ? "default" : "outline"} className="ml-2">
                              {allocation?.pointsReceived || 0} pts
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {selectedUsers.length} usuario(s) seleccionado(s)
                  </p>
                </div>

                <Button
                  onClick={handleResetPoints}
                  variant="destructive"
                  className="w-full"
                  disabled={selectedUsers.length === 0}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetear Puntos {resetType === 'total' ? 'Totales' : 'Recibidos'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveConfig}>
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
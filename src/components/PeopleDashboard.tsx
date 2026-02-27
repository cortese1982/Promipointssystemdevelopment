import { useState, useEffect } from 'react';
import { User, PointAssignment } from '../types';
import { storage, getCurrentMonth } from '../utils/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Award, Users, TrendingUp, Download, LogOut, BarChart3, Search, Filter, Mail, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardSkeleton } from './SkeletonLoader';
import { MobileNav } from './MobileNav';
import { AdminSettings } from './AdminSettings';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface PeopleDashboardProps {
  user: User;
  onLogout: () => void;
}

const COLORS = ['#0052A3', '#FF6B35', '#28A745', '#FFC107', '#6C757D', '#17A2B8', '#E83E8C', '#6610F2'];

export function PeopleDashboard({ user, onLogout }: PeopleDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<PointAssignment[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'name' | 'department'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setTimeout(() => {
      loadData();
      setIsLoading(false);
    }, 800);
  }, []);

  const loadData = () => {
    const allUsers = storage.getUsers();
    setUsers(allUsers);

    const month = getCurrentMonth();
    const allAssignments = storage.getAssignments();
    const currentMonthAssignments = allAssignments.filter(a => a.month === month);
    setAssignments(currentMonthAssignments);

    const report = allUsers.map(u => {
      const received = currentMonthAssignments.filter(a => a.toUserId === u.id);
      const totalPoints = received.reduce((sum, a) => sum + a.points, 0);
      const allocation = storage.getUserAllocation(u.id, month);

      const categoryBreakdown = received.reduce((acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + a.points;
        return acc;
      }, {} as Record<string, number>);

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        pointsReceived: totalPoints,
        recognitionCount: received.length,
        pointsGiven: allocation ? 10 - allocation.pointsRemaining : 0,
        categoryBreakdown,
      };
    });

    setReportData(report);

    const categoryTotals = currentMonthAssignments.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + a.points;
      return acc;
    }, {} as Record<string, number>);

    const categoryDataArray = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));

    setCategoryData(categoryDataArray);
  };

  const exportToCSV = () => {
    const month = getCurrentMonth();
    const headers = ['Nombre', 'Email', 'Departamento', 'Puntos Recibidos', 'Reconocimientos', 'Puntos Otorgados', 'Categorías'];
    const rows = filteredAndSortedData.map(r => [
      r.name,
      r.email,
      r.department,
      r.pointsReceived,
      r.recognitionCount,
      r.pointsGiven,
      Object.entries(r.categoryBreakdown).map(([cat, pts]) => `${cat}:${pts}`).join(';'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promipoints-reporte-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Reporte exportado exitosamente', {
      description: `Archivo: promipoints-reporte-${month}.csv`
    });
  };

  const exportDetailedReport = () => {
    const month = getCurrentMonth();
    const headers = ['Fecha', 'Remitente', 'Destinatario', 'Departamento', 'Puntos', 'Categoría', 'Mensaje'];
    const rows = assignments.map(a => {
      const from = users.find(u => u.id === a.fromUserId);
      const to = users.find(u => u.id === a.toUserId);
      return [
        new Date(a.timestamp).toLocaleDateString('es-MX'),
        from?.name || 'N/A',
        to?.name || 'N/A',
        to?.department || 'N/A',
        a.points,
        a.category,
        a.message || 'Sin mensaje',
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promipoints-detallado-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Reporte detallado exportado', {
      description: `Archivo: promipoints-detallado-${month}.csv`
    });
  };

  const departments = ['all', ...Array.from(new Set(users.map(u => u.department)))];

  const filteredAndSortedData = reportData
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || r.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'points') comparison = a.pointsReceived - b.pointsReceived;
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'department') comparison = a.department.localeCompare(b.department);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPointsCirculating = assignments.reduce((sum, a) => sum + a.points, 0);
  const activeUsers = reportData.filter(r => r.pointsGiven > 0).length;
  const avgPointsPerUser = reportData.length > 0 
    ? (totalPointsCirculating / reportData.length).toFixed(1) 
    : 0;
  const participationRate = users.length > 0 
    ? ((activeUsers / users.length) * 100).toFixed(0)
    : 0;

  const toggleSort = (field: 'points' | 'name' | 'department') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Header */}
        <motion.header 
          className="bg-card border-b shadow-sm sticky top-0 z-40"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-2 shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl">PromiPoints - People Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Grupo Prominente</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.department}</p>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* KPIs */}
              <motion.div 
                className="grid gap-4 md:grid-cols-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Total Colaboradores</CardTitle>
                    <Users className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="text-4xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      {users.length}
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">en la organización</p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Tasa de Participación</CardTitle>
                    <TrendingUp className="h-5 w-5 text-success" />
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="text-4xl text-success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      {participationRate}%
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeUsers} usuarios activos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Puntos en Circulación</CardTitle>
                    <Award className="h-5 w-5 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="text-4xl text-secondary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      {totalPointsCirculating}
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">este mes</p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Promedio por Usuario</CardTitle>
                    <BarChart3 className="h-5 w-5 text-[#FFC107]" />
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="text-4xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3 }}
                    >
                      {avgPointsPerUser}
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">puntos recibidos</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main Content */}
              <Tabs defaultValue="report" className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <TabsList>
                    <TabsTrigger value="report">
                      <FileText className="w-4 h-4 mr-2" />
                      Reporte
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analíticas
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex gap-2">
                    {user.role === 'superadmin' && (
                      <AdminSettings onUpdate={loadData} />
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={exportToCSV} variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Exportar</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar reporte consolidado</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={exportDetailedReport} variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Detallado</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar reporte detallado</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <TabsContent value="report" className="space-y-4">
                  <Card className="border-2">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <CardTitle>Reporte Mensual de PromiPoints</CardTitle>
                          <CardDescription>
                            Desglose completo por colaborador - {getCurrentMonth()}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Filters */}
                      <div className="grid gap-3 sm:grid-cols-3 pt-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                          <SelectTrigger>
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los departamentos</SelectItem>
                            {departments.filter(d => d !== 'all').map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="text-sm text-muted-foreground flex items-center justify-center sm:justify-end">
                          Mostrando {filteredAndSortedData.length} de {reportData.length}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Desktop Table View */}
                      <div className="rounded-lg border overflow-x-auto hidden lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <button 
                                  onClick={() => toggleSort('name')}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  Colaborador
                                  {sortBy === 'name' && (
                                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </TableHead>
                              <TableHead>
                                <button 
                                  onClick={() => toggleSort('department')}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  Departamento
                                  {sortBy === 'department' && (
                                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </TableHead>
                              <TableHead className="text-center">
                                <button 
                                  onClick={() => toggleSort('points')}
                                  className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                                >
                                  Puntos Recibidos
                                  {sortBy === 'points' && (
                                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </TableHead>
                              <TableHead className="text-center">Reconocimientos</TableHead>
                              <TableHead className="text-center">Puntos Dados</TableHead>
                              <TableHead>Categorías Principales</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAndSortedData.map((row, index) => {
                              const topCategories = Object.entries(row.categoryBreakdown)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 2);

                              return (
                                <motion.tr
                                  key={row.userId}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-accent/50 transition-colors"
                                >
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{row.name}</p>
                                      <p className="text-xs text-muted-foreground">{row.email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>{row.department}</TableCell>
                                  <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center min-w-[40px] h-10 rounded-full bg-secondary/10 text-secondary font-semibold">
                                      {row.pointsReceived}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center font-medium">{row.recognitionCount}</TableCell>
                                  <TableCell className="text-center">
                                    <span className={row.pointsGiven === 10 ? 'text-success font-semibold' : ''}>
                                      {row.pointsGiven}/10
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {topCategories.length > 0 ? (
                                        topCategories.map(([cat, points]) => (
                                          <Badge key={cat} variant="secondary" className="text-xs">
                                            {cat} ({points})
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-xs text-muted-foreground">Sin datos</span>
                                      )}
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="space-y-3 lg:hidden">
                        {filteredAndSortedData.map((row, index) => {
                          const topCategories = Object.entries(row.categoryBreakdown)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 2);

                          return (
                            <motion.div
                              key={row.userId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-card border-2 rounded-lg p-4 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">{row.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {row.department}
                                  </Badge>
                                </div>
                                <div className="flex flex-col items-center ml-3">
                                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10">
                                    <span className="text-xl text-secondary font-semibold">{row.pointsReceived}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-1">puntos</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b">
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Recibidos</p>
                                  <p className="text-lg font-semibold text-secondary">{row.recognitionCount}</p>
                                </div>
                                <div className="text-center border-x">
                                  <p className="text-xs text-muted-foreground">Dados</p>
                                  <p className={`text-lg font-semibold ${row.pointsGiven === 10 ? 'text-success' : ''}`}>
                                    {row.pointsGiven}/10
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Categorías</p>
                                  <p className="text-lg font-semibold">{Object.keys(row.categoryBreakdown).length}</p>
                                </div>
                              </div>

                              {topCategories.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-muted-foreground mb-2">Principales:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {topCategories.map(([cat, points]) => (
                                      <Badge key={cat} variant="secondary" className="text-xs">
                                        {cat} ({points})
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle>Top 10 Colaboradores</CardTitle>
                          <CardDescription>Por puntos recibidos este mes</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={reportData.slice(0, 10)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                              <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                height={120}
                                fontSize={12}
                              />
                              <YAxis fontSize={12} />
                              <ChartTooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '2px solid #e0e0e0',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar dataKey="pointsReceived" fill="#FF6B35" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle>Distribución por Categorías</CardTitle>
                          <CardDescription>Puntos totales por valor organizacional</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '2px solid #e0e0e0',
                                  borderRadius: '8px',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle>Participación por Departamento</CardTitle>
                          <CardDescription>Puntos otorgados por departamento</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart 
                              data={Object.entries(
                                reportData.reduce((acc, r) => {
                                  acc[r.department] = (acc[r.department] || 0) + r.pointsGiven;
                                  return acc;
                                }, {} as Record<string, number>)
                              ).map(([department, points]) => ({ department, points }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                              <XAxis dataKey="department" fontSize={12} />
                              <YAxis fontSize={12} />
                              <ChartTooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '2px solid #e0e0e0',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar dataKey="points" fill="#0052A3" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle>Métricas de Engagement</CardTitle>
                          <CardDescription>Resumen de actividad mensual</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <motion.div 
                              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border"
                              whileHover={{ scale: 1.02 }}
                            >
                              <p className="text-sm text-muted-foreground mb-1">Total Transacciones</p>
                              <p className="text-3xl text-primary">{assignments.length}</p>
                            </motion.div>
                            
                            <motion.div 
                              className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-4 border"
                              whileHover={{ scale: 1.02 }}
                            >
                              <p className="text-sm text-muted-foreground mb-1">Promedio/Asignación</p>
                              <p className="text-3xl text-secondary">
                                {assignments.length > 0 
                                  ? (totalPointsCirculating / assignments.length).toFixed(1)
                                  : 0}
                              </p>
                            </motion.div>
                            
                            <motion.div 
                              className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-4 border"
                              whileHover={{ scale: 1.02 }}
                            >
                              <p className="text-sm text-muted-foreground mb-1">Categoría Popular</p>
                              <p className="text-lg text-success mt-2">
                                {categoryData.length > 0 
                                  ? categoryData.sort((a, b) => b.value - a.value)[0].name
                                  : 'N/A'}
                              </p>
                            </motion.div>
                            
                            <motion.div 
                              className="bg-gradient-to-br from-[#FFC107]/10 to-[#FFC107]/5 rounded-lg p-4 border"
                              whileHover={{ scale: 1.02 }}
                            >
                              <p className="text-sm text-muted-foreground mb-1">Tasa de Uso</p>
                              <p className="text-3xl text-[#FFC107]">
                                {users.length > 0
                                  ? `${((totalPointsCirculating / (users.length * 10)) * 100).toFixed(0)}%`
                                  : '0%'}
                              </p>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
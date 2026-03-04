import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Utensils, 
  ClipboardList, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  Download, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  FileText,
  Table as TableIcon,
  RefreshCw,
  Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, parse, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Employee, MenuOption, Order, Settings, View } from './types';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const variants: any = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = 'text', placeholder = '', className = '' }: any) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
    />
  </div>
);

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('refeicaopro_auth') === 'true';
  });
  const [currentView, setCurrentView] = useState<View>(() => {
    return (localStorage.getItem('refeicaopro_auth') === 'true') ? 'register' : 'dashboard'
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [settings, setSettings] = useState<Settings>({ lunch_deadline: '10:00', dinner_deadline: '16:00' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, menuRes, setRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/menus'),
        fetch('/api/settings')
      ]);
      
      setEmployees(await empRes.json());
      setMenus(await menuRes.json());
      setSettings(await setRes.json());
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    localStorage.setItem('refeicaopro_auth', 'true');
    setIsAuthenticated(true);
    setCurrentView('register');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                <Utensils className="text-white w-8 h-8" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">RefeiçãoPro</h1>
                <p className="text-slate-500">Controle de Refeições</p>
              </div>
            </div>
            
            <Button onClick={handleLogin} className="w-full py-4 text-lg">
              Entrar
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erro ao Carregar</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={fetchData}>Tentar Novamente</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Utensils className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-lg">RefeiçãoPro</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
          />
          <NavItem 
            icon={<ClipboardList size={20} />} 
            label="Registrar Pedidos" 
            active={currentView === 'register'} 
            onClick={() => setCurrentView('register')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Funcionários" 
            active={currentView === 'employees'} 
            onClick={() => setCurrentView('employees')} 
          />
          <NavItem 
            icon={<Utensils size={20} />} 
            label="Cardápios" 
            active={currentView === 'menu'} 
            onClick={() => setCurrentView('menu')} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Relatórios" 
            active={currentView === 'reports'} 
            onClick={() => setCurrentView('reports')} 
          />
          <NavItem 
            icon={<SettingsIcon size={20} />} 
            label="Configurações" 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => {
              localStorage.removeItem('refeicaopro_auth');
              setIsAuthenticated(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 z-50 h-16">
        <MobileNavItem 
          icon={<BarChart3 size={20} />} 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')} 
        />
        <MobileNavItem 
          icon={<ClipboardList size={20} />} 
          active={currentView === 'register'} 
          onClick={() => setCurrentView('register')} 
        />
        <MobileNavItem 
          icon={<Users size={20} />} 
          active={currentView === 'employees'} 
          onClick={() => setCurrentView('employees')} 
        />
        <MobileNavItem 
          icon={<Utensils size={20} />} 
          active={currentView === 'menu'} 
          onClick={() => setCurrentView('menu')} 
        />
        <MobileNavItem 
          icon={<FileText size={20} />} 
          active={currentView === 'reports'} 
          onClick={() => setCurrentView('reports')} 
        />
        <button 
          onClick={() => {
            localStorage.removeItem('refeicaopro_auth');
            setIsAuthenticated(false);
          }}
          className="p-2 text-slate-400"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && <DashboardView key={`dashboard-${refreshKey}`} employees={employees} refreshKey={refreshKey} />}
          {currentView === 'register' && <RegisterView key="register" employees={employees} menus={menus} settings={settings} onSave={fetchData} />}
          {currentView === 'employees' && <EmployeesView key="employees" employees={employees} onUpdate={fetchData} />}
          {currentView === 'menu' && <MenuView key="menu" menus={menus} onUpdate={fetchData} />}
          {currentView === 'reports' && <ReportsView key="reports" employees={employees} />}
          {currentView === 'settings' && <SettingsView key="settings" settings={settings} onUpdate={fetchData} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
        active ? 'text-slate-900' : 'text-slate-400'
      }`}
    >
      <div className={`p-2 rounded-xl ${active ? 'bg-slate-100' : ''}`}>
        {icon}
      </div>
    </button>
  );
}

// --- Views ---

function DashboardView({ employees, refreshKey }: { employees: Employee[], refreshKey: number, key?: string }) {
  const [stats, setStats] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      // Fetch today's orders for stats
      const resOrders = await fetch(`/api/orders?date=${today}`);
      const ordersToday: Order[] = await resOrders.json();
      
      // Fetch all reports for export functionality
      const resReports = await fetch(`/api/reports`);
      const allReports: Order[] = await resReports.json();
      setData(allReports);

      const lunch = ordersToday.filter(o => o.meal_type === 'lunch');
      const dinner = ordersToday.filter(o => o.meal_type === 'dinner');
      
      setStats({
        lunch: {
          pedidos: lunch.filter(o => o.option_name && o.option_name !== '0').length,
          naoPediram: lunch.filter(o => !o.option_name || o.option_name === '0').length
        },
        dinner: {
          pedidos: dinner.filter(o => o.option_name && o.option_name !== '0').length,
          naoPediram: dinner.filter(o => !o.option_name || o.option_name === '0').length
        }
      });
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh every 30 seconds to keep everyone updated
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const exportExcel = () => {
    const lunchOrders = data.filter(o => o.meal_type === 'lunch');
    const dinnerOrders = data.filter(o => o.meal_type === 'dinner');

    const getGroup = (name: string) => {
      if (name.toUpperCase().includes('ADM CONS')) return 'Grupo ADM CONS';
      if (name.toUpperCase().includes('BFA')) return 'Grupo BFA';
      return 'Outros Funcionários';
    };

    const sortFn = (a: Order, b: Order) => {
      // 1. Group order
      const groupA = getGroup(a.employee_name);
      const groupB = getGroup(b.employee_name);
      const groupOrder = { 'Grupo ADM CONS': 1, 'Grupo BFA': 2, 'Outros Funcionários': 3 };
      if (groupOrder[groupA as keyof typeof groupOrder] !== groupOrder[groupB as keyof typeof groupOrder]) {
        return groupOrder[groupA as keyof typeof groupOrder] - groupOrder[groupB as keyof typeof groupOrder];
      }

      // 2. Orders before absences
      const aHasOrder = a.option_name && a.option_name !== '0';
      const bHasOrder = b.option_name && b.option_name !== '0';
      if (aHasOrder && !bHasOrder) return -1;
      if (!aHasOrder && bHasOrder) return 1;

      // 3. Outsourced before Employee
      if (aHasOrder && bHasOrder) {
        if (a.employee_type === 'outsourced' && b.employee_type === 'employee') return -1;
        if (a.employee_type === 'employee' && b.employee_type === 'outsourced') return 1;
      }

      // 4. Name
      return a.employee_name.localeCompare(b.employee_name);
    };

    const sortedLunch = [...lunchOrders].sort(sortFn);
    const sortedDinner = [...dinnerOrders].sort(sortFn);

    const createSection = (title: string, orders: Order[]) => {
      const rows = orders.map(o => [
        format(new Date(o.date + 'T00:00:00'), 'dd/MM/yyyy'),
        o.employee_name,
        getGroup(o.employee_name),
        o.employee_type === 'employee' ? 'Empresa' : 'Terceiro',
        o.meal_type === 'lunch' ? 'Almoço' : 'Janta',
        o.option_name || '0',
        o.portion_size || '-'
      ]);

      const totalGeral = orders.filter(o => o.option_name && o.option_name !== '0').length;
      const totalEmpresa = orders.filter(o => o.employee_type === 'employee' && o.option_name && o.option_name !== '0').length;
      const totalTerceiros = orders.filter(o => o.employee_type === 'outsourced' && o.option_name && o.option_name !== '0').length;

      return [
        ...rows,
        [],
        ['', '', '', '', `RESUMO ${title.toUpperCase()}`, '', ''],
        ['', '', '', '', 'Total Geral de Pedidos', totalGeral, ''],
        ['', '', '', '', 'Total Pedidos Empresa', totalEmpresa, ''],
        ['', '', '', '', 'Total Pedidos Terceiros', totalTerceiros, '']
      ];
    };

    const finalAOA = [
      ['Data', 'Funcionário', 'Grupo', 'Tipo', 'Refeição', 'Opção', 'Tamanho'],
      ...createSection('Almoço', sortedLunch),
      [],
      [],
      ...createSection('Janta', sortedDinner)
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(finalAOA);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Atualizado");
    XLSX.writeFile(workbook, `relatorio-atualizado-${format(new Date(), 'dd-MM-HHmm')}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Relatório de Refeições - Atualizado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 15);
    const tableData = data.slice(0, 50).map(o => [ // Limit to last 50 for quick dashboard preview
      format(new Date(o.date), 'dd/MM/yyyy'),
      o.employee_name,
      o.meal_type === 'lunch' ? 'Almoço' : 'Janta',
      o.option_name || '0'
    ]);
    (doc as any).autoTable({
      head: [['Data', 'Funcionário', 'Refeição', 'Opção']],
      body: tableData,
      startY: 20
    });
    doc.save(`relatorio-atualizado.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Bem-vindo, Gestor</h2>
          <div className="flex items-center gap-2 text-slate-500 text-sm md:text-base">
            <p>Visão geral hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</p>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <p className="flex items-center gap-1 text-xs">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 
              Atualizado às {format(lastUpdate, 'HH:mm:ss')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={exportExcel} className="flex-1 md:flex-none py-1.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
            <TableIcon size={16} /> Baixar Excel
          </Button>
          <Button variant="secondary" onClick={exportPDF} className="flex-1 md:flex-none py-1.5 text-xs">
            <FileText size={16} /> PDF
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Funcionários</p>
            <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Utensils size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Almoços Hoje</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.lunch?.pedidos || 0}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Jantas Hoje</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.dinner?.pedidos || 0}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-slate-400" />
            Resumo de Hoje
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Almoço', pedidos: stats?.lunch?.pedidos || 0, naoPediram: stats?.lunch?.naoPediram || 0 },
                { name: 'Janta', pedidos: stats?.dinner?.pedidos || 0, naoPediram: stats?.dinner?.naoPediram || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pedidos" fill="#10b981" radius={[4, 4, 0, 0]} name="Pedidos" />
                <Bar dataKey="naoPediram" fill="#0f172a" radius={[4, 4, 0, 0]} name="Não pediram" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function RegisterView({ employees, menus, settings, onSave }: { employees: Employee[], menus: MenuOption[], settings: Settings, onSave: () => void, key?: string }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [orders, setOrders] = useState<Record<number, { option_id: number | null, portion_size: string | null }>>({});
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [date, mealType]);

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders?date=${date}&meal_type=${mealType}`);
    const data: Order[] = await res.json();
    const orderMap: Record<number, { option_id: number | null, portion_size: string | null }> = {};
    data.forEach(o => {
      orderMap[o.employee_id] = { option_id: o.option_id, portion_size: o.portion_size };
    });
    setOrders(orderMap);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orderList = employees.map(emp => {
        const orderData = orders[emp.id] || { option_id: null, portion_size: null };
        const option = menus.find(m => m.id === orderData.option_id);
        return {
          employee_id: emp.id,
          option_id: orderData.option_id || null,
          option_name: option ? option.option_name : '0',
          portion_size: orderData.portion_size || null
        };
      });

      await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          meal_type: mealType,
          orders: orderList
        })
      });
      alert('Pedidos salvos com sucesso!');
      onSave();
    } catch (err) {
      alert('Erro ao salvar pedidos');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Deseja realmente finalizar o dia? Isso irá arquivar os pedidos em Relatórios e limpar a tela atual.')) return;
    
    try {
      const res = await fetch('/api/reports/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });
      
      if (res.ok) {
        alert('Dia finalizado com sucesso! Os dados foram movidos para Relatórios.');
        onSave();
        fetchOrders(); // Refresh to clear
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao finalizar dia');
      }
    } catch (err) {
      alert('Erro ao finalizar dia');
    }
  };

  const handleReset = () => {
    setOrders({});
    setShowResetConfirm(false);
    alert("Pedidos zerados localmente. Não esqueça de Salvar.");
  };

  const currentMenu = menus.filter(m => m.meal_type === mealType);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const admConsEmployees = filteredEmployees.filter(e => e.name.toUpperCase().includes('ADM CONS'));
  const bfaEmployees = filteredEmployees.filter(e => e.name.toUpperCase().includes('BFA'));
  const otherEmployees = filteredEmployees.filter(e => !e.name.toUpperCase().includes('ADM CONS') && !e.name.toUpperCase().includes('BFA'));

  const renderEmployeeRow = (emp: Employee, bgColor: string) => (
    <tr key={emp.id} className={`${bgColor} border-b border-slate-100 transition-colors hidden md:table-row`}>
      <td className="px-6 py-4 font-medium text-slate-900">{emp.name}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          emp.type === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {emp.type === 'employee' ? 'Empresa' : 'Terceiro'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOrders(prev => ({ ...prev, [emp.id]: { option_id: null, portion_size: null } }))}
              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${
                !orders[emp.id]?.option_id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              Sem pedido (0)
            </button>
            {currentMenu.map(opt => (
              <button
                key={opt.id}
                onClick={() => setOrders(prev => ({ ...prev, [emp.id]: { option_id: opt.id, portion_size: prev[emp.id]?.portion_size || 'Média' } }))}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${
                  orders[emp.id]?.option_id === opt.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {opt.option_name}
              </button>
            ))}
          </div>

          {orders[emp.id]?.option_id && (
            <div className="flex items-center gap-2 p-1 md:p-2 bg-white/50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase ml-1">Tamanho:</span>
              {['Pequena', 'Média', 'Executiva'].map(size => (
                <button
                  key={size}
                  onClick={() => setOrders(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], portion_size: size } }))}
                  className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all ${
                    orders[emp.id]?.portion_size === size
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  const renderEmployeeCardMobile = (emp: Employee, bgColor: string) => (
    <div key={`mobile-${emp.id}`} className={`${bgColor} p-4 border-b border-slate-100 space-y-3 md:hidden`}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-slate-900">{emp.name}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          emp.type === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {emp.type === 'employee' ? 'Empresa' : 'Terceiro'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOrders(prev => ({ ...prev, [emp.id]: { option_id: null, portion_size: null } }))}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
              !orders[emp.id]?.option_id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Sem pedido (0)
          </button>
          {currentMenu.map(opt => (
            <button
              key={opt.id}
              onClick={() => setOrders(prev => ({ ...prev, [emp.id]: { option_id: opt.id, portion_size: prev[emp.id]?.portion_size || 'Média' } }))}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                orders[emp.id]?.option_id === opt.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {opt.option_name}
            </button>
          ))}
        </div>

        {orders[emp.id]?.option_id && (
          <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tamanho:</span>
            <div className="flex gap-1.5">
              {['Pequena', 'Média', 'Executiva'].map(size => (
                <button
                  key={size}
                  onClick={() => setOrders(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], portion_size: size } }))}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    orders[emp.id]?.portion_size === size
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Registrar Pedidos</h2>
          <p className="text-slate-500 text-sm md:text-base">Lançamento rápido para os {employees.length} funcionários.</p>
          <div className="flex gap-2 mt-3">
            <Button 
              variant="primary" 
              className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm text-[10px] md:text-xs py-1 md:py-1.5 h-auto px-3 md:px-4" 
              onClick={handleFinalize}
            >
              Finalizar Dia
            </Button>
            <div className="relative">
              <Button 
                variant="secondary" 
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 border-none shadow-sm text-[10px] md:text-xs py-1 md:py-1.5 h-auto px-3 md:px-4" 
                onClick={() => setShowResetConfirm(!showResetConfirm)}
              >
                Zerar Pedidos
              </Button>
              {showResetConfirm && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-slate-100 z-50 w-64 animate-in fade-in zoom-in-95">
                  <p className="text-sm font-bold text-slate-900 mb-3">Confirmar limpeza?</p>
                  <div className="flex gap-2">
                    <Button variant="danger" className="py-1 text-xs flex-1" onClick={handleReset}>Sim, Zerar</Button>
                    <Button variant="secondary" className="py-1 text-xs flex-1" onClick={() => setShowResetConfirm(false)}>Não</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-center w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar funcionário..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all bg-white text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input type="date" value={date} onChange={setDate} className="flex-1 md:w-40" />
            <select 
              value={mealType} 
              onChange={(e) => setMealType(e.target.value as any)}
              className="flex-1 md:flex-none px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all bg-white text-sm"
            >
              <option value="lunch">Almoço</option>
              <option value="dinner">Janta</option>
            </select>
          </div>
        </div>
      </header>

      <Card className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Funcionário</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tipo</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Opção Escolhida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Grupo ADM CONS */}
              {admConsEmployees.length > 0 && (
                <>
                  <tr className="bg-amber-100/50">
                    <td colSpan={3} className="px-6 py-2 text-xs font-bold text-amber-700 uppercase tracking-wider">Grupo ADM CONS</td>
                  </tr>
                  {admConsEmployees.map(emp => renderEmployeeRow(emp, 'bg-amber-50'))}
                </>
              )}

              {/* Grupo BFA */}
              {bfaEmployees.length > 0 && (
                <>
                  <tr className="bg-sky-100/50">
                    <td colSpan={3} className="px-6 py-2 text-xs font-bold text-sky-700 uppercase tracking-wider">Grupo BFA</td>
                  </tr>
                  {bfaEmployees.map(emp => renderEmployeeRow(emp, 'bg-sky-50'))}
                </>
              )}

              {/* Restante */}
              {(admConsEmployees.length > 0 || bfaEmployees.length > 0) && otherEmployees.length > 0 && (
                <tr className="bg-slate-100/50">
                  <td colSpan={3} className="px-6 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Outros Funcionários</td>
                </tr>
              )}
              {otherEmployees.map(emp => renderEmployeeRow(emp, 'bg-white'))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {admConsEmployees.length > 0 && (
            <>
              <div className="bg-amber-100/50 px-4 py-2 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Grupo ADM CONS</div>
              {admConsEmployees.map(emp => renderEmployeeCardMobile(emp, 'bg-amber-50/30'))}
            </>
          )}
          {bfaEmployees.length > 0 && (
            <>
              <div className="bg-sky-100/50 px-4 py-2 text-[10px] font-bold text-sky-700 uppercase tracking-wider">Grupo BFA</div>
              {bfaEmployees.map(emp => renderEmployeeCardMobile(emp, 'bg-sky-50/30'))}
            </>
          )}
          {(admConsEmployees.length > 0 || bfaEmployees.length > 0) && otherEmployees.length > 0 && (
            <div className="bg-slate-100/50 px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Outros Funcionários</div>
          )}
          {otherEmployees.map(emp => renderEmployeeCardMobile(emp, 'bg-white'))}
        </div>
      </Card>

      <div className="flex justify-end gap-4 sticky bottom-8">
        <Button 
          variant="primary" 
          className="px-12 py-4 shadow-xl" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Todos os Pedidos'}
        </Button>
      </div>
    </motion.div>
  );
}

function EmployeesView({ employees, onUpdate }: { employees: Employee[], onUpdate: () => void, key?: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'employee' | 'outsourced'>('employee');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/employees/${editingId}` : '/api/employees';
    const method = editingId ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
    
    setName('');
    setType('employee');
    setIsAdding(false);
    setEditingId(null);
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    onUpdate();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Funcionários</h2>
          <p className="text-slate-500 text-sm md:text-base">Gerencie a lista fixa de colaboradores.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="w-full md:w-auto py-2 text-sm"><Plus size={18} /> Adicionar Novo</Button>
      </header>

      {(isAdding || editingId) && (
        <Card className="p-6 border-slate-900 border-2">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <Input label="Nome Completo" value={name} onChange={setName} className="flex-1 min-w-[300px]" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600">Vínculo</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all bg-white"
              >
                <option value="employee">Funcionário da Empresa</option>
                <option value="outsourced">Terceirizado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Atualizar' : 'Cadastrar'}</Button>
              <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingId(null); setName(''); }}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {/* Desktop Table */}
        <table className="w-full text-left hidden md:table">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nome</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tipo</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{emp.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    emp.type === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {emp.type === 'employee' ? 'Empresa' : 'Terceiro'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {deletingId === emp.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <span className="text-xs font-bold text-red-600 uppercase">Confirmar?</span>
                        <button 
                          onClick={() => handleDelete(emp.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-all"
                        >
                          Sim
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-300 transition-all"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setEditingId(emp.id); setName(emp.name); setType(emp.type); setDeletingId(null); }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { setDeletingId(emp.id); setEditingId(null); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {employees.map(emp => (
            <div key={`mobile-emp-${emp.id}`} className="p-4 space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{emp.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    emp.type === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {emp.type === 'employee' ? 'Empresa' : 'Terceiro'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {deletingId === emp.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Confirmar Exclusão
                      </button>
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setEditingId(emp.id); setName(emp.name); setType(emp.type); setDeletingId(null); }}
                        className="p-2 text-slate-600 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => { setDeletingId(emp.id); setEditingId(null); }}
                        className="p-2 text-red-500 bg-red-50 rounded-lg border border-red-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function MenuView({ menus, onUpdate }: { menus: MenuOption[], onUpdate: () => void, key?: string }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'lunch' | 'dinner'>('lunch');
  const [isFixed, setIsFixed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await fetch('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_type: type, option_name: name, is_fixed: isFixed })
    });
    setName('');
    setIsFixed(false);
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/menus/${id}`, { method: 'DELETE' });
    onUpdate();
  };

  const handleClear = async (mealType: 'lunch' | 'dinner') => {
    if (!window.confirm(`Deseja limpar todas as opções de ${mealType === 'lunch' ? 'Almoço' : 'Janta'} que NÃO estão fixadas?`)) return;
    await fetch('/api/menus/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_type: mealType })
    });
    onUpdate();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Configurar Cardápios</h2>
        <p className="text-slate-500 text-sm md:text-base">Defina as opções disponíveis para cada refeição.</p>
      </header>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Adicionar Opção</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <Input label="Nome da Opção (ex: Frango Grelhado)" value={name} onChange={setName} className="flex-1 min-w-[250px]" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600">Refeição</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all bg-white"
            >
              <option value="lunch">Almoço</option>
              <option value="dinner">Janta</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input 
              type="checkbox" 
              id="isFixed" 
              checked={isFixed} 
              onChange={(e) => setIsFixed(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="isFixed" className="text-sm font-medium text-slate-600 cursor-pointer">Fixar Opção</label>
          </div>
          <Button type="submit"><Plus size={20} /> Adicionar</Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Utensils size={20} className="text-blue-500" />
              Opções de Almoço
            </h3>
            <button 
              onClick={() => handleClear('lunch')}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors"
            >
              Limpar Diários
            </button>
          </div>
          <div className="space-y-2">
            {menus.filter(m => m.meal_type === 'lunch').map(opt => (
              <div key={opt.id} className={`flex items-center justify-between p-3 rounded-lg border ${opt.is_fixed ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{opt.option_name}</span>
                  {opt.is_fixed === 1 && <Pin size={12} className="text-amber-500 fill-amber-500" />}
                </div>
                <button onClick={() => handleDelete(opt.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              Opções de Janta
            </h3>
            <button 
              onClick={() => handleClear('dinner')}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors"
            >
              Limpar Diários
            </button>
          </div>
          <div className="space-y-2">
            {menus.filter(m => m.meal_type === 'dinner').map(opt => (
              <div key={opt.id} className={`flex items-center justify-between p-3 rounded-lg border ${opt.is_fixed ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{opt.option_name}</span>
                  {opt.is_fixed === 1 && <Pin size={12} className="text-amber-500 fill-amber-500" />}
                </div>
                <button onClick={() => handleDelete(opt.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function ReportsView({ employees }: { employees: Employee[], key?: string }) {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      console.log(`Reports fetching all data`);
      const res = await fetch(`/api/reports`);
      const reports = await res.json();
      console.log(`Reports received ${reports.length} records`);
      setData(Array.isArray(reports) ? reports : []);
    } catch (err) {
      console.error("Reports fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (date: string) => {
    if (!confirm(`Deseja realmente excluir todos os relatórios do dia ${format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}?`)) return;
    
    try {
      await fetch(`/api/reports/${date}`, { method: 'DELETE' });
      fetchReport();
    } catch (err) {
      alert('Erro ao excluir relatório');
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Relatório Geral de Refeições`, 14, 15);
    
    const tableData = data.map(o => [
      format(new Date(o.date), 'dd/MM/yyyy'),
      o.employee_name,
      o.meal_type === 'lunch' ? 'Almoço' : 'Janta',
      o.option_name === '0' ? '0' : `${o.option_name} (${o.portion_size || 'Média'})`
    ]);

    (doc as any).autoTable({
      head: [['Data', 'Funcionário', 'Refeição', 'Opção (Tamanho)']],
      body: tableData,
      startY: 20
    });

    doc.save(`relatorio-geral-refeicoes.pdf`);
  };

  const exportExcel = () => {
    const lunchOrders = data.filter(o => o.meal_type === 'lunch');
    const dinnerOrders = data.filter(o => o.meal_type === 'dinner');

    const getGroup = (name: string) => {
      if (name.toUpperCase().includes('ADM CONS')) return 'Grupo ADM CONS';
      if (name.toUpperCase().includes('BFA')) return 'Grupo BFA';
      return 'Outros Funcionários';
    };

    const sortFn = (a: Order, b: Order) => {
      // 1. Group order
      const groupA = getGroup(a.employee_name);
      const groupB = getGroup(b.employee_name);
      const groupOrder = { 'Grupo ADM CONS': 1, 'Grupo BFA': 2, 'Outros Funcionários': 3 };
      if (groupOrder[groupA as keyof typeof groupOrder] !== groupOrder[groupB as keyof typeof groupOrder]) {
        return groupOrder[groupA as keyof typeof groupOrder] - groupOrder[groupB as keyof typeof groupOrder];
      }

      // 2. Orders before absences
      const aHasOrder = a.option_name && a.option_name !== '0';
      const bHasOrder = b.option_name && b.option_name !== '0';
      if (aHasOrder && !bHasOrder) return -1;
      if (!aHasOrder && bHasOrder) return 1;

      // 3. Outsourced before Employee
      if (aHasOrder && bHasOrder) {
        if (a.employee_type === 'outsourced' && b.employee_type === 'employee') return -1;
        if (a.employee_type === 'employee' && b.employee_type === 'outsourced') return 1;
      }

      // 4. Name
      return a.employee_name.localeCompare(b.employee_name);
    };

    const sortedLunch = [...lunchOrders].sort(sortFn);
    const sortedDinner = [...dinnerOrders].sort(sortFn);

    const createSection = (title: string, orders: Order[]) => {
      const rows = orders.map(o => [
        format(new Date(o.date + 'T00:00:00'), 'dd/MM/yyyy'),
        o.employee_name,
        getGroup(o.employee_name),
        o.employee_type === 'employee' ? 'Empresa' : 'Terceiro',
        o.meal_type === 'lunch' ? 'Almoço' : 'Janta',
        o.option_name || '0',
        o.portion_size || '-'
      ]);

      const totalGeral = orders.filter(o => o.option_name && o.option_name !== '0').length;
      const totalEmpresa = orders.filter(o => o.employee_type === 'employee' && o.option_name && o.option_name !== '0').length;
      const totalTerceiros = orders.filter(o => o.employee_type === 'outsourced' && o.option_name && o.option_name !== '0').length;

      return [
        ...rows,
        [],
        ['', '', '', '', `RESUMO ${title.toUpperCase()}`, '', ''],
        ['', '', '', '', 'Total Geral de Pedidos', totalGeral, ''],
        ['', '', '', '', 'Total Pedidos Empresa', totalEmpresa, ''],
        ['', '', '', '', 'Total Pedidos Terceiros', totalTerceiros, '']
      ];
    };

    const finalAOA = [
      ['Data', 'Funcionário', 'Grupo', 'Tipo', 'Refeição', 'Opção', 'Tamanho'],
      ...createSection('Almoço', sortedLunch),
      [],
      [],
      ...createSection('Janta', sortedDinner)
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(finalAOA);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `relatorio-geral-refeicoes.xlsx`);
  };

  const totalsByOption = data.reduce((acc: any, curr) => {
    const isAbsence = !curr.option_name || curr.option_name === '0';
    const key = isAbsence 
      ? `${curr.meal_type === 'lunch' ? 'Almoço' : 'Janta'} - Ausência (0)`
      : `${curr.meal_type === 'lunch' ? 'Almoço' : 'Janta'} - ${curr.option_name} (${curr.portion_size || 'Média'})`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayOrders = data.filter(o => o.date === today && o.option_name && o.option_name !== '0').length;
  const totalAbsences = data.filter(o => !o.option_name || o.option_name === '0').length;
  const outsourcedCount = data.filter(o => o.employee_type === 'outsourced' && o.option_name && o.option_name !== '0').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Relatórios</h2>
          <p className="text-slate-500 text-sm md:text-base">Visualize e exporte os dados de consumo atualizados.</p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <Button 
            variant="secondary" 
            onClick={fetchReport}
            disabled={loading}
            className="flex-1 md:flex-none py-1.5 text-xs"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
          </Button>
          <Button variant="secondary" onClick={exportExcel} className="flex-1 md:flex-none py-1.5 text-xs"><TableIcon size={16} /> Excel</Button>
          <Button variant="secondary" onClick={exportPDF} className="flex-1 md:flex-none py-1.5 text-xs"><FileText size={16} /> PDF</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-slate-500 text-sm font-medium">Pedidos do Dia</p>
          <p className="text-3xl font-bold text-emerald-600">{todayOrders}</p>
          <p className="text-xs text-slate-400 mt-1">Última atualização: {format(new Date(), 'HH:mm')}</p>
        </Card>
        <Card className="p-6">
          <p className="text-slate-500 text-sm font-medium">Total de Ausências (0)</p>
          <p className="text-3xl font-bold text-red-600">{totalAbsences}</p>
          <p className="text-xs text-slate-400 mt-1">Total de registros "Sem pedido"</p>
        </Card>
        <Card className="p-6">
          <p className="text-slate-500 text-sm font-medium">Refeições Terceiros</p>
          <p className="text-3xl font-bold text-emerald-600">{outsourcedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Total acumulado de terceiros</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">Consumo por Opção</h3>
          <div className="space-y-4">
            {Object.entries(totalsByOption).map(([label, count]: any) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">{label}</span>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="h-2 bg-slate-100 rounded-full flex-1 overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full" 
                      style={{ width: `${(count / data.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">Histórico Detalhado</h3>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white border-bottom border-slate-100">
                <tr>
                  <th className="py-2 font-semibold text-slate-500">Data</th>
                  <th className="py-2 font-semibold text-slate-500">Funcionário</th>
                  <th className="py-2 font-semibold text-slate-500">Refeição</th>
                  <th className="py-2 font-semibold text-slate-500">Opção</th>
                  <th className="py-2 font-semibold text-slate-500">Tamanho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((o, i) => (
                  <tr key={i}>
                    <td className="py-2 text-slate-500">{format(new Date(o.date), 'dd/MM')}</td>
                    <td className="py-2 font-medium text-slate-900">{o.employee_name}</td>
                    <td className="py-2 text-slate-600">{o.meal_type === 'lunch' ? 'Almoço' : 'Janta'}</td>
                    <td className="py-2">
                      <span className={o.option_name === '0' ? 'text-red-500 font-bold' : 'text-slate-900'}>
                        {o.option_name || '0'}
                      </span>
                    </td>
                    <td className="py-2 text-slate-500">{o.option_name !== '0' ? o.portion_size : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function SettingsView({ settings, onUpdate }: { settings: Settings, onUpdate: () => void, key?: string }) {
  const [newPassword, setNewPassword] = useState('');

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manager_password: newPassword || undefined
      })
    });
    alert('Configurações salvas!');
    onUpdate();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-500">Ajuste a segurança do sistema.</p>
      </header>

      <Card className="p-8 space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <SettingsIcon size={20} className="text-slate-400" />
            Segurança
          </h3>
          <Input 
            label="Nova Senha do Gestor" 
            type="password" 
            value={newPassword} 
            onChange={setNewPassword} 
            placeholder="Deixe em branco para não alterar"
          />
        </section>

        <div className="pt-4">
          <Button onClick={handleSave} className="w-full py-4">Salvar Alterações</Button>
        </div>
      </Card>
    </motion.div>
  );
}

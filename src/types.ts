export interface Employee {
  id: number;
  name: string;
  type: 'employee' | 'outsourced';
  active: number;
}

export interface MenuOption {
  id: number;
  meal_type: 'lunch' | 'dinner';
  option_name: string;
  is_fixed?: number;
}

export interface Order {
  id: number;
  employee_id: number;
  date: string;
  meal_type: 'lunch' | 'dinner';
  option_id: number | null;
  option_name: string | null;
  portion_size: string | null;
  employee_name?: string;
  employee_type?: 'employee' | 'outsourced';
}

export interface Settings {
  lunch_deadline: string;
  dinner_deadline: string;
  manager_password?: string;
}

export type View = 'dashboard' | 'employees' | 'menu' | 'register' | 'reports' | 'settings';

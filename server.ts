import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import "dotenv/config";

const db = new Database("meals.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('employee', 'outsourced')) NOT NULL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS menu_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type TEXT CHECK(meal_type IN ('lunch', 'dinner')) NOT NULL,
    option_name TEXT NOT NULL,
    is_fixed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    meal_type TEXT CHECK(meal_type IN ('lunch', 'dinner')) NOT NULL,
    option_id INTEGER, -- NULL means "Sem pedido" or "0"
    option_name TEXT, -- Store name at time of order for history
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS finalized_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    employee_name TEXT,
    employee_type TEXT,
    date TEXT,
    meal_type TEXT,
    option_id INTEGER,
    option_name TEXT,
    portion_size TEXT
  );
`);

// Migration for existing databases
try {
  db.exec("ALTER TABLE orders ADD COLUMN portion_size TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE employees ADD COLUMN active INTEGER DEFAULT 1;");
} catch (e) {}

try {
  db.exec("ALTER TABLE menu_options ADD COLUMN is_fixed INTEGER DEFAULT 0;");
} catch (e) {}

// Seed initial settings if not exist
const seedSettings = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
seedSettings.run("lunch_deadline", "10:00");
seedSettings.run("dinner_deadline", "16:00");
seedSettings.run("manager_password", process.env.MANAGER_PASSWORD || "admin");

// Seed employees if table is empty or just add them
const employeesToSeed = [
  "ANTONIO FRANCISCO VIEIRA - ENC KIM ADM CONS",
  "GUILHERME ENG ADM CONS",
  "JOSUEL LIMEIRA - CHAVEIRINHO ADM CONS",
  "PAULO JAFET ENG ADM CONS",
  "PAULO JOSÉ - TEC SEGURANÇA ADM CONS",
  "RICK ENG CASAMAX ADM CONS",
  "VALTER ADM CONS",
  "WILLIAN ADM CONS",
  "ADELSON PEREIRA",
  "ADRIEL BENJAMIM",
  "AIRON MENDES",
  "ANTONIO CARLOS BOMBARDE",
  "BRUNO ROCHA",
  "COSME FABRICIO",
  "EDVALDO FRANCISCO MOTORISTA",
  "ERINALDO",
  "FABIANO - TOP",
  "FABIO LUIZZ",
  "FLAVIO RODRIGUES",
  "GIOVANE",
  "GLSON OLIVEIRA",
  "JOÃO BATISTA",
  "JOÃO PAULO APONT CASAMAX",
  "JOÃO PEREIRA",
  "JONATHAN LIMA",
  "JOSÉ CARLOS",
  "JOSÉ OSMAR",
  "JOSÉ SALES",
  "MARCOS LEANDRO",
  "MONICA SANTOS",
  "RAFAEL - OP ESCA CASAMAX",
  "REGINALDO DOS SANTOS",
  "RICARDO OP LONG HEAT",
  "ROBERTO - OP CASAMAX",
  "ROGER",
  "ROSEMIR RODRIGUES",
  "TIAGO IBIPIANO",
  "UILSON CARMO",
  "WAGNER OP ESCAV",
  "ANICETO - BFA",
  "ANTONIO ERISNALDO - BFA",
  "ARIMATEIA SOUSA - BFA",
  "ATACILIO ALVES - BFA",
  "EVANILSON BRAGA - BFA",
  "GILMAR RAMOS - BFA",
  "JANDERSON OLIVEIRA - BFA",
  "JEFFERSON TEIXEIRA - BFA",
  "LUCIO DA MATTA - BFA",
  "MARCOS BRAGA - BFA",
  "MATHEUS BRAGA - BFA",
  "MAXUEL DA COSTA - BFA",
  "MISAEL JUNQUEIRA - BFA",
  "RENAN - BFA",
  "WILKER - BFA"
];

const checkAnyEmployee = db.prepare("SELECT id FROM employees LIMIT 1").get();

if (!checkAnyEmployee) {
  const insertEmployee = db.prepare("INSERT INTO employees (name, type) VALUES (?, ?)");
  employeesToSeed.forEach(name => {
    const type = (name.toUpperCase().includes('BFA') || name.toUpperCase().includes('TOP')) ? 'outsourced' : 'employee';
    insertEmployee.run(name, type);
  });
}

// Force update existing records to ensure BFA and TOP are outsourced
db.prepare("UPDATE employees SET type = 'outsourced' WHERE name LIKE '%BFA%' OR name LIKE '%TOP%'").run();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    console.log(`Tentativa de login com a senha: ${password}`);
    try {
      const stored = db.prepare("SELECT value FROM settings WHERE key = 'manager_password'").get() as { value: string } | undefined;
      console.log(`Senha armazenada: ${stored?.value}`);
      
      if (stored && password === stored.value) {
        console.log("Login bem-sucedido");
        res.json({ success: true });
      } else {
        console.log("Senha incorreta");
        res.status(401).json({ success: false, message: "Senha incorreta" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  });

  // Employees
  app.get("/api/employees", (req, res) => {
    const employees = db.prepare("SELECT * FROM employees WHERE active = 1 ORDER BY name ASC").all();
    res.json(employees);
  });

  app.post("/api/employees", (req, res) => {
    const { name, type } = req.body;
    const result = db.prepare("INSERT INTO employees (name, type) VALUES (?, ?)").run(name, type);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/employees/bulk", (req, res) => {
    const { employees } = req.body; // employees: [{ name, type }]
    const insert = db.prepare("INSERT INTO employees (name, type) VALUES (?, ?)");
    const transaction = db.transaction((list) => {
      for (const emp of list) {
        insert.run(emp.name, emp.type);
      }
    });
    transaction(employees);
    res.json({ success: true });
  });

  app.put("/api/employees/:id", (req, res) => {
    const { name, type } = req.body;
    db.prepare("UPDATE employees SET name = ?, type = ? WHERE id = ?").run(name, type, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/employees/:id", (req, res) => {
    try {
      console.log(`Tentando desativar funcionário ID: ${req.params.id}`);
      const result = db.prepare("UPDATE employees SET active = 0 WHERE id = ?").run(req.params.id);
      console.log(`Resultado da exclusão: ${result.changes} linhas alteradas`);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
      res.status(500).json({ success: false, message: "Erro ao excluir no banco de dados" });
    }
  });

  // Menus
  app.get("/api/menus", (req, res) => {
    const menus = db.prepare("SELECT * FROM menu_options").all();
    res.json(menus);
  });

  app.post("/api/menus", (req, res) => {
    const { meal_type, option_name, is_fixed } = req.body;
    const result = db.prepare("INSERT INTO menu_options (meal_type, option_name, is_fixed) VALUES (?, ?, ?)").run(meal_type, option_name, is_fixed ? 1 : 0);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/menus/clear", (req, res) => {
    const { meal_type } = req.body;
    db.prepare("DELETE FROM menu_options WHERE meal_type = ? AND is_fixed = 0").run(meal_type);
    res.json({ success: true });
  });

  app.delete("/api/menus/:id", (req, res) => {
    db.prepare("DELETE FROM menu_options WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const formatted = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json(formatted);
  });

  app.post("/api/settings", (req, res) => {
    const { lunch_deadline, dinner_deadline, manager_password } = req.body;
    if (lunch_deadline) db.prepare("UPDATE settings SET value = ? WHERE key = 'lunch_deadline'").run(lunch_deadline);
    if (dinner_deadline) db.prepare("UPDATE settings SET value = ? WHERE key = 'dinner_deadline'").run(dinner_deadline);
    if (manager_password) db.prepare("UPDATE settings SET value = ? WHERE key = 'manager_password'").run(manager_password);
    res.json({ success: true });
  });

  // Orders
  app.get("/api/orders", (req, res) => {
    const { date, meal_type } = req.query;
    console.log(`GET /api/orders - date: ${date}, meal_type: ${meal_type}`);
    let query = `
      SELECT o.*, e.name as employee_name, e.type as employee_type 
      FROM orders o 
      JOIN employees e ON o.employee_id = e.id 
      WHERE o.date = ?
    `;
    const params: any[] = [date];
    
    if (meal_type) {
      query += " AND o.meal_type = ?";
      params.push(meal_type);
    }
    
    const orders = db.prepare(query).all(...params);
    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  });

  app.post("/api/orders/bulk", (req, res) => {
    const { date, meal_type, orders } = req.body;
    console.log(`POST /api/orders/bulk - date: ${date}, meal_type: ${meal_type}, count: ${orders?.length}`);
    
    const deleteExisting = db.prepare("DELETE FROM orders WHERE date = ? AND meal_type = ?");
    const insertOrder = db.prepare("INSERT INTO orders (employee_id, date, meal_type, option_id, option_name, portion_size) VALUES (?, ?, ?, ?, ?, ?)");

    try {
      const transaction = db.transaction((orderList) => {
        deleteExisting.run(date, meal_type);
        for (const order of orderList) {
          insertOrder.run(order.employee_id, date, meal_type, order.option_id, order.option_name, order.portion_size);
        }
      });

      transaction(orders);
      console.log("Bulk insert successful");
      res.json({ success: true });
    } catch (error) {
      console.error("Error in bulk insert:", error);
      res.status(500).json({ success: false, message: "Erro ao salvar pedidos" });
    }
  });

  app.get("/api/reports", (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`GET /api/reports - range: ${startDate || 'ALL'} to ${endDate || 'ALL'}`);
    
    try {
      let finalizedQuery = "SELECT * FROM finalized_reports";
      let activeQuery = `
        SELECT o.*, e.name as employee_name, e.type as employee_type 
        FROM orders o 
        JOIN employees e ON o.employee_id = e.id
      `;
      const params: any[] = [];

      if (startDate && endDate) {
        finalizedQuery += " WHERE date BETWEEN ? AND ?";
        activeQuery += " WHERE o.date BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }

      // Get finalized reports
      const finalized = db.prepare(finalizedQuery).all(...params) as any[];
      console.log(`Found ${finalized.length} finalized reports`);

      // Get active orders (not yet finalized)
      let active = db.prepare(activeQuery).all(...params) as any[];
      
      // If we are looking at today, ensure all active employees are included
      const today = new Date().toISOString().split('T')[0];
      const isLookingAtToday = !startDate || (startDate <= today && endDate >= today);
      
      if (isLookingAtToday) {
        const allActiveEmployees = db.prepare("SELECT id, name, type FROM employees WHERE active = 1").all() as any[];
        
        // Ensure both lunch and dinner are represented for today
        ['lunch', 'dinner'].forEach(mType => {
          allActiveEmployees.forEach(emp => {
            const hasOrder = active.find(o => o.employee_id === emp.id && o.date === today && o.meal_type === mType);
            if (!hasOrder) {
              active.push({
                employee_id: emp.id,
                employee_name: emp.name,
                employee_type: emp.type,
                date: today,
                meal_type: mType,
                option_id: null,
                option_name: '0',
                portion_size: null
              });
            }
          });
        });
      }

      // Combine them
      const combined = [...finalized, ...active].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.meal_type !== b.meal_type) return a.meal_type === 'lunch' ? -1 : 1;
        return a.employee_name.localeCompare(b.employee_name);
      });

      console.log(`Returning ${combined.length} total records`);
      res.json(combined);
    } catch (error) {
      console.error("Error in /api/reports:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar relatórios" });
    }
  });

  app.post("/api/reports/finalize", (req, res) => {
    const { date } = req.body;
    console.log(`POST /api/reports/finalize - date: ${date}`);
    
    const orders = db.prepare(`
      SELECT o.*, e.name as employee_name, e.type as employee_type 
      FROM orders o 
      JOIN employees e ON o.employee_id = e.id 
      WHERE o.date = ?
    `).all(date) as any[];

    console.log(`Found ${orders.length} orders to finalize`);

    if (orders.length === 0) {
      return res.status(400).json({ success: false, message: "Não há pedidos para finalizar nesta data." });
    }

    const insertFinalized = db.prepare(`
      INSERT INTO finalized_reports (employee_id, employee_name, employee_type, date, meal_type, option_id, option_name, portion_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const deleteOrders = db.prepare("DELETE FROM orders WHERE date = ?");

    try {
      const transaction = db.transaction((orderList) => {
        for (const order of orderList) {
          insertFinalized.run(
            order.employee_id,
            order.employee_name,
            order.employee_type,
            order.date,
            order.meal_type,
            order.option_id,
            order.option_name,
            order.portion_size
          );
        }
        deleteOrders.run(date);
      });

      transaction(orders);
      console.log("Finalization successful");
      res.json({ success: true });
    } catch (error) {
      console.error("Error finalizing day:", error);
      res.status(500).json({ success: false, message: "Erro ao finalizar dia" });
    }
  });

  app.delete("/api/reports/:date", (req, res) => {
    db.prepare("DELETE FROM finalized_reports WHERE date = ?").run(req.params.date);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  // Log DB stats
  try {
    const empCount = db.prepare("SELECT COUNT(*) as count FROM employees").get() as any;
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get() as any;
    const reportCount = db.prepare("SELECT COUNT(*) as count FROM finalized_reports").get() as any;
    console.log(`DB Stats - Employees: ${empCount.count}, Orders: ${orderCount.count}, Finalized: ${reportCount.count}`);
  } catch (e) {
    console.error("Error logging DB stats:", e);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

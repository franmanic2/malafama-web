import fs from 'fs';
import { subDays, subHours } from 'date-fns';

const dbPath = './db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Clear existing finance and rentals to start fresh
db.finance = [];
db.rentals = [];

const products = db.inventory;
const tables = db.tables;

// Generate realistic data for the last 30 days
for (let i = 30; i >= 0; i--) {
  const date = subDays(new Date(), i);
  const isWeekend = date.getDay() === 0 || date.getDay() === 5 || date.getDay() === 6; // Fri, Sat, Sun
  
  // Random rentals per day
  const numRentals = isWeekend ? Math.floor(Math.random() * 10) + 10 : Math.floor(Math.random() * 5) + 3;
  
  for (let j = 0; j < numRentals; j++) {
    const isBilliard = Math.random() > 0.4;
    const hours = isBilliard ? (Math.random() * 2 + 0.5) : (Math.random() * 4 + 1); // Random hours
    const people = isBilliard ? 1 : Math.floor(Math.random() * 4) + 2;
    const amount = isBilliard ? (hours * 15) : (hours * 10 * people); 
    const rentalDate = subHours(date, Math.floor(Math.random() * 10)); // Random hour that day
    
    // Add income to finance
    db.finance.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'income',
      category: isBilliard ? 'Alquiler Billar' : 'Alquiler Poker',
      amount: parseFloat(amount.toFixed(2)),
      date: rentalDate.toISOString(),
      paymentMethod: Math.random() > 0.5 ? 'cash' : 'yape',
      description: `Alquiler ${isBilliard ? 'Billar' : 'Poker'} - Día ${30 - i}`
    });
  }

  // Add some inventory sales
  const numSales = isWeekend ? Math.floor(Math.random() * 8) + 5 : Math.floor(Math.random() * 3) + 1;
  for (let j = 0; j < numSales; j++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 4) + 1;
    const saleDate = subHours(date, Math.floor(Math.random() * 10));
    db.finance.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'income',
      category: 'Venta Productos',
      amount: parseFloat((product.sellPrice * qty).toFixed(2)),
      date: saleDate.toISOString(),
      paymentMethod: 'cash',
      description: `Venta: ${product.name} x${qty}`
    });
  }

  // Add random expenses every few days
  if (i % 7 === 0) {
    db.finance.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'expense',
      category: 'Servicios',
      amount: parseFloat((Math.random() * 100 + 50).toFixed(2)),
      date: date.toISOString(),
      paymentMethod: 'cash',
      description: 'Pago de luz/agua/mantenimiento'
    });
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Dummy data generated successfully.');

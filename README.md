# MALAFAMA - Admin Web App

Sistema administrativo premium para local de Billar y Poker.

## Stack Tecnológico
- **Vue.js 3** (Composition API)
- **Vite**
- **Pinia** (Manejo de estado)
- **TailwindCSS** (Estilos y Animaciones)
- **Lucide Icons**
- **Chart.js** (Gráficas)
- **JSON Server** (Base de datos local)

## Requisitos
- Node.js (versión recomendada 20+)
- npm

## Instalación

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Ejecutar la base de datos (JSON Server):
   ```bash
   npm run server
   ```

3. Ejecutar la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

## Acceso
- **Usuario:** `admin`
- **Contraseña:** `admin123`

## Características
- **Dashboard:** Resumen visual, ingresos/egresos y gráficas.
- **Mesas:** Control de 4 mesas de billar y 3 de poker con cronómetro en tiempo real.
- **Inventario:** CRUD de productos, alertas de stock bajo y registro de ventas.
- **Finanzas:** Historial detallado de transacciones (Ingresos/Egresos).
- **Deudas:** Gestión de deudas de clientes y pagos pendientes.
- **Reportes:** Resumen por periodos y estadísticas de uso.

## Estructura del Proyecto
- `src/stores/`: Lógica de negocio y persistencia de estado.
- `src/views/`: Pantallas principales del sistema.
- `src/layouts/`: Estructura base (Sidebar, Topbar).
- `src/components/`: Componentes reutilizables (TableCard, Modals).
- `src/services/`: Capa de conexión con la API (Axios).
- `src/styles/`: Configuración global de diseño y Tailwind.

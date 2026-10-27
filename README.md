# CarWeb

## Requisitos

- [Node.js](https://nodejs.org/) 22 o superior (incluye npm)
- MySQL 8, o [XAMPP](https://www.apachefriends.org/) (trae MariaDB, compatible)
- [DBeaver](https://dbeaver.io/) o [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) para ejecutar los scripts SQL

## 1. Base de datos

1. Enciende el servidor:
   - **XAMPP:** abre el XAMPP Control Panel y pulsa **Start** en **MySQL** (usuario `root`, sin contraseña).
   - **MySQL Server:** ya corre como servicio de Windows (usuario `root` y la contraseña que pusiste al instalarlo).
2. Conéctate a `localhost:3306` con el usuario `root`:
   - **DBeaver:** Nueva conexión → **MySQL** (o MariaDB), con el campo *Database* vacío.
   - **Workbench:** usa la conexión *Local instance* o créala con el botón **+**.
3. Crea la base (una sola vez):
   ```sql
   CREATE DATABASE IF NOT EXISTS CarWeb;
   ```
4. Ejecuta los scripts completos, en este orden:
   1. `CarWebCode/sql/CarWeb.sql`: crea las tablas.
   2. `CarWebCode/sql/seed_cars.sql`: carga autos de prueba.

   | Cliente | Abrir el script | Ejecutarlo completo |
   |---|---|---|
   | DBeaver | Editor SQL → Abrir script SQL | **Alt + X** |
   | Workbench | File → Open SQL Script | **Ctrl + Shift + Enter** (o el rayo ⚡) |

   No uses **Ctrl + Enter**: en los dos clientes solo ejecuta una sentencia.

## 2. Backend (puerto 3000)

```bash
cd CarWebCode/backend
npm install
```

Copia `.env.example` a un archivo nuevo `.env` y pon tu contraseña de MySQL (con XAMPP, déjala vacía):

```env
PORT=3000
DB_USER=root
DB_PORT=3306
DB_HOST=localhost
DB_PASSWORD=tu_contraseña
DB_NAME=CarWeb
```

Arranca el servidor:

```bash
npm run dev
```

Debe aparecer `server running on port: 3000`.

## 3. Frontend (puerto 4200)

En otra terminal:

```bash
cd CarWebCode/frontend
npm install
npm start
```

Abre http://localhost:4200

El frontend reenvía las peticiones `/api` al backend del puerto 3000 (`proxy.conf.json`), así que **el backend tiene que estar corriendo**.

## Pruebas

```bash
cd CarWebCode/backend && npm test
cd CarWebCode/frontend && npm test
```

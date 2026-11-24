# CarWeb

## Requisitos

- [Node.js](https://nodejs.org/) 22 o superior (incluye npm)
- **MySQL 8.0.16 o superior** (incluye 8.4 LTS). XAMPP/MariaDB **no** sirve: el esquema usa la collation `utf8mb4_0900_ai_ci`, que solo existe en MySQL 8
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) o [DBeaver](https://dbeaver.io/) para ejecutar los scripts SQL

## 1. Base de datos

1. Conéctate a `localhost:3306` con el usuario `root` (MySQL Server corre como servicio de Windows):
   - **Workbench:** usa la conexión *Local instance* o créala con el botón **+**.
   - **DBeaver:** Nueva conexión → **MySQL**, con el campo *Database* vacío.
2. Ejecuta los scripts completos, en este orden (el primero crea la base `carweb`):
   1. `CarWebCode/sql/schema.sql`: crea la base y las 12 tablas.
   2. `CarWebCode/sql/seed.sql`: carga datos de prueba. Los usuarios del personal entran con la contraseña de desarrollo `DevPassword123!` (por ejemplo, `ana.torres@carweb.test`).

   | Cliente | Abrir el script | Ejecutarlo completo |
   |---|---|---|
   | Workbench | File → Open SQL Script | **Ctrl + Shift + Enter** (o el rayo ⚡) |
   | DBeaver | Editor SQL → Abrir script SQL | **Alt + X** |

   No uses **Ctrl + Enter**: en los dos clientes solo ejecuta una sentencia.

   Si ya tenías la base vieja (`CarWeb`, con las tablas `Cars`, `User`…), respáldala y bórrala antes. En Windows `CarWeb` y `carweb` son la misma base, y `schema.sql` falla si encuentra tablas con el mismo nombre.

## 2. Backend (puerto 3000)

```bash
cd CarWebCode/backend
npm install
```

Copia `.env.example` a un archivo nuevo `.env` y pon tu contraseña de MySQL:

```env
PORT=3000
DB_USER=root
DB_PORT=3306
DB_HOST=localhost
DB_PASSWORD=tu_contraseña
DB_NAME=carweb
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

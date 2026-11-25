# Bitácora de desarrollo — CarWeb

Registro de cada cambio hecho en el proyecto: **qué** se hizo, **para qué sirve** y **por qué** se hizo así.

---

## 2026-10-25 — Reorganización de la estructura del frontend (Angular 22)

**Ubicación:** `CarWebCode/frontend/`

### Qué se hizo

Se reorganizó el proyecto Angular (recién creado con `ng new`, con SSR) según esta estructura:

```
frontend/src/
├── app/
│   ├── components/          # Componentes reutilizables
│   │   ├── button/          button.component.{ts,html,scss}
│   │   └── card/            card.component.{ts,html,scss}
│   ├── pages/               # Vistas completas (lazy-loaded)
│   │   └── home/            home.component.{ts,html,scss}
│   ├── services/            # Lógica de negocio y HTTP (vacía por ahora)
│   ├── models/              # Interfaces y tipos TypeScript (vacía por ahora)
│   ├── guards/              # Protección de rutas (vacía por ahora)
│   ├── app.component.ts / .html / .scss / .spec.ts
│   ├── app.routes.ts        # Rutas del navegador
│   ├── app.routes.server.ts # Rutas del SSR (sin cambios)
│   ├── app.config.ts        # Providers globales
│   └── app.config.server.ts # Config del SSR (sin cambios)
├── assets/                  # Imágenes, íconos, etc.
├── environments/
│   ├── environment.ts       # Configuración de desarrollo
│   └── environment.prod.ts  # Configuración de producción
└── styles.scss              # Estilos globales
```

### Detalle de cada cambio, su uso y el porqué

| Cambio | Para qué sirve | Por qué |
|---|---|---|
| `app.ts`, `app.html`, `app.css` y `app.spec.ts` pasan a `app.component.*`; la clase `App` pasa a `AppComponent` | Es el componente raíz que arranca la app | Para seguir la convención `nombre.component.*` del formato pedido. Así se distinguen a simple vista los componentes, servicios, modelos, etc. |
| Se actualizaron los imports en `main.ts` y `main.server.ts` | Arrancan la app en el navegador y en el servidor (SSR) | Seguían importando el archivo viejo `./app/app`; sin este cambio no compilaba |
| CSS pasa a SCSS (`styles.scss`, `*.component.scss`) y `angular.json` se ajusta (`styles`, `inlineStyleLanguage: scss`) | SCSS permite anidar selectores, usar variables, mixins, etc. | Lo pedía el formato, y SCSS hace los estilos más fáciles de mantener |
| En `angular.json` se configuraron los schematics: `style: scss` y `type: component` | Con `ng generate component` los archivos salen con `.scss` y el sufijo `.component` | Así los componentes nuevos siguen solos la misma estructura, sin renombrar a mano |
| Se borró la plantilla de bienvenida de Angular; `app.component.html` queda solo con `<router-outlet />` | El componente raíz solo muestra la página que toque según la ruta | La plantilla era de ejemplo. Cada vista ahora vive en `pages/` |
| Carpeta `pages/home/` con `HomeComponent` | Página de inicio | Las vistas completas van en `pages/`, separadas de las piezas reutilizables |
| `app.routes.ts` carga la home con `loadComponent` (lazy loading) y redirige `**` a `''` | La página se descarga solo cuando se visita; las rutas inexistentes vuelven al inicio | El lazy loading hace más liviana la carga inicial (la home sale en su propio chunk de ~2 kB) |
| `components/button/` → `<app-button>` con entradas `type`, `disabled` y evento `clicked` | Botón reutilizable en toda la app | Centraliza el estilo y el comportamiento de los botones. Si cambia el diseño, se toca en un solo lugar |
| `components/card/` → `<app-card>` con `title` opcional y contenido proyectado (`<ng-content>`) | Tarjeta contenedora reutilizable (por ejemplo, para mostrar autos) | Lo mismo: componente genérico que se reusa en varias páginas |
| Los componentes usan `input()` / `output()` (signals) | API moderna de Angular para recibir datos y emitir eventos | Es la forma recomendada en Angular 17+ y reemplaza a `@Input` / `@Output` |
| Carpetas `services/`, `models/` y `guards/` con `.gitkeep` | Lugar para la lógica HTTP, las interfaces y los guards de autenticación | Git no guarda carpetas vacías. El `.gitkeep` hace que la estructura quede en el repositorio |
| `environments/environment.ts` (`apiUrl: http://localhost:3000/api/v1`) y `environment.prod.ts` (`apiUrl: /api/v1`) | Configuración distinta para desarrollo y producción (por ejemplo, la URL del backend) | El backend Express expone sus rutas en `/api/v1`. **Ojo:** el puerto `3000` no está confirmado; el backend lo lee de `process.env.PORT` |
| `fileReplacements` en la configuración `production` de `angular.json` | En `ng build`, `environment.ts` se reemplaza por `environment.prod.ts` | Así el código siempre importa `environment.ts` y Angular elige el valor correcto según el build |
| Se agregó `src/assets/` en `assets` de `angular.json` (se sirve como `/assets/...`); `public/` se mantiene | Para guardar imágenes, íconos y archivos estáticos | Lo pedía el formato. `public/` se deja porque Angular lo usa para el `favicon.ico` |
| `styles.scss` con la variable `--color-primary` y estilos base del `body` | Estilos y colores globales | Los componentes (por ejemplo, el botón) usan la variable, y el color se cambia desde un solo lugar |
| Se borró la carpeta vacía `app/componets` | — | Tenía un error de tipeo y quedaba duplicada con `components/` |

### Verificación

- `ng build`: compila sin errores y prerenderiza 1 ruta (SSR).
- `ng test`: 1 test pasa (`AppComponent` se crea correctamente).

### Pendiente / próximos pasos sugeridos

- Confirmar el puerto real del backend y ajustar `apiUrl`.
- Crear `models/user.model.ts` y `services/user.service.ts` a partir del `CreateUserDto` del backend.

---

## 2026-10-25 — US-03 (catálogo de autos) y US-05 (detalle del auto)

**Ubicación:** `CarWebCode/sql/`, `CarWebCode/backend/`, `CarWebCode/frontend/`

### Qué se hizo

Cualquier visitante, con o sin sesión, entra a `/cars`, ve los autos disponibles en páginas de 20, abre uno y ve toda su información con fotos. Se siguió la arquitectura en capas **rutas → controladores → servicios → repositorios → base de datos**, sin que una capa se salte a otra.

### Base de datos (`sql/`)

| Cambio | Para qué sirve | Por qué |
|---|---|---|
| Nueva tabla `CarServiceHistory` (CarId, ServiceDate, Mileage, Description) en `CarWeb.sql` | Guarda el historial de servicio de cada auto | La US-05 pide mostrar el historial de servicio y no había dónde guardarlo. Tiene FK a `Cars` con `ON DELETE CASCADE`: si se borra el auto, se borra su historial |
| Se quitó una coma de más en `StockMovement` (`MovementStatus VARCHAR(50),`) | — | Era un error de sintaxis que hacía fallar el script de MySQL en esa tabla |
| Nuevo `seed_cars.sql` | Datos de prueba: 24 autos "Available" (2 páginas: 20 + 4), 2 "Sold", 1 "Reserved" y 1 "Spare parts", con fotos e historial | La especificación indica usar un seed para probar (dar de alta autos es la US-20). Los 4 no disponibles sirven para comprobar que no salen en el catálogo. El auto 3 tiene una foto rota a propósito (para probar la imagen de reemplazo) y el auto 11 no tiene fotos |

**Orden de ejecución:** primero `CarWeb.sql`, después `seed_cars.sql`.

### Backend (`backend/src/`)

| Archivo / cambio | Para qué sirve | Por qué |
|---|---|---|
| `routes/car.routes.ts` → `GET /api/v1/cars?page=N` y `GET /api/v1/cars/:id` | Endpoints públicos del catálogo y del detalle | Se montan bajo `/api/v1`, que es el prefijo que ya usaba `server.ts`. No piden login porque la US-03 lo exige |
| `controllers/car.controller.ts` | Lee la petición HTTP, valida los parámetros y responde en JSON | Separa HTTP de la lógica de negocio |
| `validators/car.ts` (`parsePage`, `parseCarId`) | `page` e `id` deben ser enteros positivos; si no, responde **400** | Validación de entradas (`Security.md`). Sin `page` se usa la página 1 |
| `services/car.service.ts` | Calcula la paginación (20 por página, `CATALOG_PAGE_SIZE`), devuelve 404 si el auto no existe y agrega `isAvailable` | Las reglas de negocio viven aquí, sin depender de Express ni de MySQL |
| `repositories/car.repository.ts` (`MySqlCarRepository` + interfaz `CarRepository`) | Consultas SQL con `mysql2` y conversión de filas a objetos | Solo esta capa toca la base. La interfaz permite usar un repositorio falso en las pruebas |
| El catálogo filtra `StatusOfCar = 'Available'` y `InventoryStatus = TRUE`, y ordena por `CarId DESC` (los más nuevos primero) | Nunca muestra autos vendidos, reservados ni para refacciones | Criterios de aceptación de la US-03. Las condiciones se guardan en una lista para que los filtros de marca y modelo (US-04) se agreguen sin rehacer nada |
| Foto del catálogo = la marcada `IsMainPhoto`, o la primera si no hay ninguna | Una foto por tarjeta | La US-03 pide foto, marca, modelo, año, kilometraje y precio |
| El detalle devuelve el auto en cualquier estado, con `status` e `isAvailable` | El front puede avisar "este auto ya no está disponible" | La US-05 pide avisar si el auto deja de estar disponible mientras se mira |
| `dtos/cars/CarDto.ts` | Define la forma exacta de las respuestas | **Nunca** se exponen `VIN`, `Plates` ni `PurchasePrice`, porque son datos internos de la agencia |
| `constants/carStatus.ts` | Valores de `StatusOfCar` en un solo lugar | Evita escribir los textos a mano en varios archivos |
| `errors/HttpError.ts` + `middlewares/errorHandler.ts` | Los errores salen como JSON `{ "error": "..." }` con su código (400, 404, 500), y las rutas inexistentes dan 404 | Respuestas de error consistentes y sin filtrar detalles internos en un 500 |
| `routes/index.ts` | Arma las piezas (repositorio → servicio → controlador) y monta `/cars` | Antes estaba vacío y `app.ts` ni siquiera arrancaba |
| `server.ts`: los middlewares se configuran en el constructor y no en `start()` | Las pruebas usan la app sin abrir un puerto | Necesario para probar con `supertest` |
| `vitest`, `supertest` y `@types/supertest` (devDependencies) | Ejecutar las pruebas | El script `npm test` ya usaba vitest, pero no estaba instalado |
| `tests/cars.test.ts` (12 pruebas) y `tests/app.test.ts` (1 prueba) | Prueban paginación, lista vacía, 400, 404, auto vendido y que no se filtran campos internos | `app.test.ts` estaba vacío y hacía fallar `npm test` |

### Frontend (`frontend/src/app/`)

| Archivo / cambio | Para qué sirve | Por qué |
|---|---|---|
| `pages/car-catalog/` → ruta `/cars?page=N` | Grilla de autos, paginación "Anterior / Página X de Y / Siguiente", mensaje "No hay autos disponibles", estado de carga y botón Reintentar si falla | US-03. La página va en la URL (`?page=`), así que se puede compartir o recargar sin perderla |
| `pages/car-detail/` → ruta `/cars/:id` | Galería (foto grande + miniaturas), precio, ficha técnica, historial de servicio y botones "Agendar cita" / "Comprar" desactivados | US-05. Los botones van desactivados porque agendar y comprar son la US-06 y la US-09 |
| El detalle vuelve a consultar el auto cada 30 s | Si lo venden o reservan mientras el usuario lo mira, aparece un aviso amarillo | Criterio de la US-05. Mientras recarga se sigue mostrando el dato anterior, sin parpadeo |
| `components/car-card/` | Tarjeta reutilizable de un auto en el catálogo | Componente reutilizable, según la estructura del proyecto |
| `directives/img-fallback.directive.ts` + `assets/images/car-placeholder.svg` | Si una foto no carga, se muestra "Foto no disponible" | Criterio de la US-05. Es una directiva (`appImgFallback`) para reusarla en cualquier `<img>`. Carpeta nueva `directives/`, porque no es un componente |
| `services/car.service.ts` | Llamadas HTTP a `/cars`. Si un auto no existe (404), devuelve `null` | Las páginas no tratan errores HTTP a mano |
| `models/car.model.ts` | Interfaces `CarSummary`, `CarDetail`, `Paginated<T>` | Son el espejo de los DTOs del backend |
| `app.routes.ts`: rutas `cars` y `cars/:id` lazy-loaded, con título de pestaña | Cada página se descarga solo al visitarla | Carga inicial más liviana |
| `app.config.ts`: `provideHttpClient(withFetch())`, `withComponentInputBinding()`, idioma `es-MX` y moneda `MXN` | HTTP, parámetros de ruta como `input()`, precios con formato "$255,000" y números con separador de miles | Configuración global (providers) |
| `app.routes.server.ts`: `/cars` y `/cars/:id` con `RenderMode.Client` | Esas páginas se generan en el navegador y no al compilar | Muestran datos vivos de la API. Prerenderizarlas al compilar intentaría llamar al backend durante el build |
| `proxy.conf.json` + `proxyConfig` en `angular.json`; `apiUrl` ahora es `/api/v1` | En desarrollo, `ng serve` (puerto 4200) reenvía `/api` al backend (puerto 3000) | Evita problemas de CORS sin tocar el backend |
| La home tiene un botón "Ver catálogo" | Acceso al catálogo | Navegación básica |
| **De SCSS a CSS:** se actualizaron las referencias `styleUrl`, `angular.json` (`styles: src/styles.css`, schematics `style: css`) y se reescribieron los estilos en CSS plano | El proyecto vuelve a compilar | Los archivos `.scss` se habían renombrado a `.css` a mano, pero las referencias seguían apuntando a `.scss` y el build fallaba. Se respetó CSS (el stack del proyecto dice "HTML, CSS"). Los selectores tipo `&__title` son de SCSS y no funcionan en CSS, por eso se reescribieron |
| Pruebas: `car.service.spec.ts`, `car-catalog.component.spec.ts`, `car-detail.component.spec.ts` | Prueban las URLs, la paginación, la lista vacía, el aviso de no disponible, el 404, la imagen de reemplazo y los botones desactivados | Verificación automática de los criterios de aceptación |

### Cómo probarlo

1. Ejecutar en MySQL `sql/CarWeb.sql` y luego `sql/seed_cars.sql`.
2. Backend: copiar `.env.example` a `.env`, completar `DB_PASSWORD` y correr `npm run dev` (puerto 3000).
3. Frontend: `npm start` y abrir `http://localhost:4200/cars`.

### Verificación

- Backend: `npm test` → 13 pruebas pasan; `tsc --noEmit` sin errores. Se levantó el servidor real: `/api/v1/cars/abc` → 400, ruta inexistente → 404 y, sin MySQL, `/api/v1/cars` → 500 en JSON (esperado).
- Frontend: `ng build` compila sin errores (1 ruta prerenderizada, catálogo y detalle como chunks lazy); `ng test` → 11 pruebas pasan.
- **No se probó contra una base MySQL real**: no hay MySQL instalado en esta máquina.

### Decisiones tomadas sin confirmar (revisar)

- Prefijo `/api/v1/cars` en vez de `/api/cars`: se mantuvo el prefijo que ya tenía el servidor.
- El catálogo también exige `InventoryStatus = TRUE`, además de "Available".
- Orden del catálogo: los autos más nuevos primero (`CarId DESC`).
- Moneda: pesos mexicanos (MXN).
- Las fotos del seed son imágenes genéricas de `picsum.photos`, no fotos reales de autos.
- Valores como "Gasoline", "Automatic" o "Good" se muestran tal como están en la base (en inglés).
- Un auto en cualquier estado (incluido "Spare parts") se puede abrir en el detalle, con el aviso de no disponible.

---

## 2026-10-25 — Colección de Postman para US-03 y US-05

**Ubicación:** `CarWebCode/postman/CarWeb-US03-US05.postman_collection.json`

### Qué se hizo

Se creó una colección de Postman lista para importar. Trae 11 peticiones con sus pruebas automáticas (pestaña *Tests*), así que cada respuesta se valida sola y no hay que revisarla a ojo.

| Petición | Qué comprueba |
|---|---|
| `GET /cars` | 200; 20 autos; `page 1`, `pageSize 20`, `total 24`, `totalPages 2`; cada auto trae foto, marca, modelo, año, kilometraje y precio; no aparecen los ids 25-28 (no disponibles); no expone VIN, placas ni precio de compra |
| `GET /cars?page=2` | 200; los 4 autos restantes |
| `GET /cars?page=99` | 200; lista vacía, pero `total` sigue en 24 |
| `GET /cars?page=0` y `?page=abc` | 400 con mensaje de error |
| `GET /cars/1` | 200; todos los campos de la US-05; `isAvailable: true`; tiene fotos e historial; sin datos internos |
| `GET /cars/25` | 200; `status: Sold`, `isAvailable: false` |
| `GET /cars/11` | 200; `photos: []` (auto sin fotos) |
| `GET /cars/9999` | 404, `Car not found` |
| `GET /cars/abc` | 400 |
| `GET /no-existe` | 404, `Route not found` |

**Por qué así:**
- La URL base está en una variable de la colección (`baseUrl = http://localhost:3000/api/v1`). Si cambia el puerto, se cambia en un solo lugar.
- Los números esperados (24 autos, ids 25-28, auto 11 sin fotos) salen de `seed_cars.sql`. Si se modifica el seed, hay que ajustar las pruebas.

### Cómo usarla

1. Ejecutar `sql/CarWeb.sql` y luego `sql/seed_cars.sql` en MySQL (por ejemplo, desde DBeaver).
2. En `backend/`, copiar `.env.example` a `.env` y poner la contraseña de MySQL en `DB_PASSWORD`. `.env` ya está en el `.gitignore`, así que no se sube al repositorio.
3. En `backend/`, correr `npm run dev`. Debe aparecer `server running on port: 3000`.
4. En Postman: **Import** → elegir el archivo `.json` de la colección.
5. Clic derecho en la colección → **Run collection** → **Run**. Se ejecutan las 11 peticiones y se ve qué pruebas pasan.

### Errores comunes

| Lo que pasa | Causa | Solución |
|---|---|---|
| `Error: connect ECONNREFUSED 127.0.0.1:3000` en Postman | El backend no está corriendo | `npm run dev` en `backend/` |
| 500 `Internal server error` y en la consola `ECONNREFUSED ...:3306` | MySQL no está encendido | Iniciar el servicio de MySQL |
| 500 y en la consola `Access denied for user` | Usuario o contraseña incorrectos en `.env` | Revisar `DB_USER` y `DB_PASSWORD` |
| 500 y en la consola `Unknown database` o `Table ... doesn't exist` | No se ejecutó `CarWeb.sql` | Ejecutarlo y después el seed |
| El servidor no arranca o el puerto sale `NaN` | No existe `.env` o le falta `PORT` | Crear `.env` desde `.env.example` |
| Fallan las pruebas de totales (24, 4, etc.) | El seed no se ejecutó o se cambiaron los datos | Volver a ejecutar `seed_cars.sql` (borra y recrea los autos) |

---

## 2026-10-26 — Recuperación de archivos tras el merge del equipo

### Qué pasó

En la máquina local se hizo un commit del frontend, luego un `stash` y después un `pull` de `Development`. Este último trajo la rama `5-manager-register-and-update-inventory` (US-20), con `Cars.Controller.ts`, `Cars.routes.ts` y `cars.validators.ts`. Como el trabajo del backend de la US-03/US-05 nunca se había subido a Git:
- Los archivos **nuevos** terminaron en la **papelera de Windows**. Entre ellos, esta bitácora.
- Los archivos **editados** volvieron a la versión del repositorio.

### Qué se hizo (sin usar Git, por indicación del usuario)

| Acción | Detalle | Por qué |
|---|---|---|
| Se restauraron 13 archivos desde la papelera a su carpeta original | `services/car.service.ts`, `repositories/car.repository.ts`, `controllers/car.controller.ts`, `routes/car.routes.ts`, `dtos/cars/CarDto.ts`, `errors/HttpError.ts`, `middlewares/errorHandler.ts`, `constants/carStatus.ts`, `validators/car.ts`, `tests/cars.test.ts`, `sql/seed_cars.sql`, `postman/CarWeb-US03-US05.postman_collection.json` y `Documentation/Info.md` | Recuperar el trabajo sin rehacerlo |
| `sql/CarWeb.sql`: se volvió a agregar la tabla `CarServiceHistory` y a quitar la coma de más en `StockMovement` | Mismo cambio del 2026-10-25 | El pull lo había revertido. Sin la tabla, el seed y el detalle del auto fallan |
| `server.ts`: otra vez los middlewares en el constructor + `notFoundHandler` y `errorHandler` | Mismo cambio del 2026-10-25 | Para que las pruebas funcionen y los errores salgan como JSON |
| `routes/index.ts`: **se combinaron** las rutas del equipo con las del catálogo | Primero se montan las del equipo (`/cars/getAllCars`, `/cars/createCar`, etc.) y después las nuestras (`GET /cars?page=N`, `GET /cars/:id`) | El orden importa: si `/:id` fuera primero, "atraparía" `/cars/getAllCars` y respondería 400. Así conviven sin tocar el código del equipo |
| `tests/app.test.ts`: se volvió a escribir la prueba del 404 | — | Vacío, hace fallar `npm test` |
| `npm install -D vitest supertest @types/supertest` | Se vuelven a declarar en `package.json` | El pull los había quitado. Otro compañero no podría correr las pruebas |
| `express-validator` | Lo instaló el usuario | Lo requiere `cars.validators.ts` del equipo. Sin él no compilaba |

### Verificación

- `tsc --noEmit`: sin errores.
- `npm test`: 13 pruebas pasan.
- Servidor real (sin MySQL): `GET /cars` → 500 JSON (esperado, sin base); `/cars/abc` → 400 (nuestro validador); `/cars/getAllCars` → lo atiende el controlador del equipo; `/cars/getCarsById/abc` → 400 del equipo; ruta inexistente → 404.

### Pendientes y avisos

- **Subir el trabajo a Git** en una rama propia. Mientras no se haga commit, un `pull` o un `stash` puede volver a borrarlo.
- Los endpoints del equipo `getAllCars` y `getCarsById` hacen `select *` y devuelven `VIN`, `Plates` y `PurchasePrice`. Sirven para el Manager (US-20), pero deberían ir protegidos con login. Para el cliente se usan `GET /cars` y `GET /cars/:id`.
- Las dos convenciones de URL (`/cars/getAllCars` frente a `/cars/:id`) conviene unificarlas con el equipo.
- Las respuestas de error del equipo usan `{ "message": ... }` y las nuestras `{ "error": ... }`. Conviene acordar un solo formato.
- `cars.validators.ts` (express-validator) todavía no se usa en `Cars.routes.ts`.
- Falta crear `backend/.env` desde `.env.example`.

---

## 2026-10-26 — Se elimina el historial de servicio

### Qué se hizo

Se quitó por completo el "historial de servicio" del detalle del auto, porque **no está previsto en este proyecto** (indicación del usuario). Esto reemplaza lo que se había agregado el 2026-10-25.

| Lugar | Qué se quitó |
|---|---|
| `sql/CarWeb.sql` | La tabla `CarServiceHistory` (se conserva el arreglo de la coma en `StockMovement`) |
| `sql/seed_cars.sql` | `TRUNCATE TABLE CarServiceHistory` y el `INSERT` del historial |
| `backend/src/repositories/car.repository.ts` | La consulta a `CarServiceHistory`, el tipo `ServiceRow` y el campo `serviceHistory` |
| `backend/src/dtos/cars/CarDto.ts` | `ServiceRecordDto` y el campo `serviceHistory` de `CarDetailDto` |
| `backend/tests/cars.test.ts` | Los datos y la verificación del historial |
| `frontend/src/app/models/car.model.ts` | `ServiceRecord` y el campo `serviceHistory` |
| `frontend/.../car-detail.component.html` / `.css` / `.ts` | La sección "Historial de servicio", sus estilos y el `DatePipe`, que solo se usaba ahí |
| `frontend/.../car-detail.component.spec.ts` | Los datos y la verificación del historial |
| `postman/CarWeb-US03-US05.postman_collection.json` | `serviceHistory` en la prueba del detalle |

**Nota:** si la base ya se había creado con la versión anterior, la tabla sobrante se borra con `DROP TABLE IF EXISTS CarServiceHistory;`.

### Verificación

- Backend: `tsc` sin errores; `npm test` → 13 pruebas pasan.
- Frontend: `ng build` sin errores; `ng test` → 11 pruebas pasan.

---

## 2026-10-26 — Cómo se conecta el frontend con el backend

No hubo cambios de código: la conexión ya estaba configurada desde el 2026-10-25. Se verificó de punta a punta.

### Cómo funciona

```
Navegador ──► http://localhost:4200/api/v1/cars ──► (proxy de ng serve) ──► http://localhost:3000/api/v1/cars
              (Angular, ng serve)                                         (Express, npm run dev)
```

| Pieza | Archivo | Qué hace |
|---|---|---|
| URL base de la API | `frontend/src/environments/environment.ts` → `apiUrl: '/api/v1'` | El servicio `CarService` arma las URLs con esta base: `/api/v1/cars`, `/api/v1/cars/5` |
| Proxy de desarrollo | `frontend/proxy.conf.json` → `"/api": { "target": "http://localhost:3000" }` | Todo lo que empieza con `/api` en el puerto 4200 se reenvía al backend del puerto 3000 |
| Activación del proxy | `frontend/angular.json` → `serve.options.proxyConfig: "proxy.conf.json"` | `ng serve` (`npm start`) carga el proxy automáticamente |
| Puerto del backend | `backend/.env` → `PORT=3000` | Tiene que coincidir con el `target` del proxy |

**Por qué un proxy y no la URL completa del backend:** para el navegador, el front (4200) y el back (3000) son orígenes distintos. Sin el proxy, el navegador bloquea las peticiones por **CORS**. Con el proxy, el navegador cree que habla con el mismo servidor (4200), y es `ng serve` quien reenvía la petición al 3000. Así no hace falta instalar ni configurar `cors` en Express.

### Pasos para levantar todo

1. MySQL encendido, con `CarWeb.sql` y `seed_cars.sql` ejecutados.
2. Terminal 1, en `CarWebCode/backend`: crear `.env` desde `.env.example` (con `PORT=3000` y la contraseña) y correr `npm run dev`.
3. Terminal 2, en `CarWebCode/frontend`: `npm start`.
4. Abrir `http://localhost:4200/cars`.

### Verificación

Con el backend en el 3000 y `ng serve` en el 4200:
- `GET http://localhost:4200/api/v1/cars/abc` → 400 `{"error":"id must be a positive integer"}`. La respuesta viene del backend, así que el proxy funciona.
- `GET http://localhost:4200/api/v1/cars` → 500 (esperado: en esta máquina no hay MySQL).

### Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| El catálogo muestra "No pudimos cargar el catálogo" y en la consola de `ng serve` aparece `[vite] http proxy error ... ECONNREFUSED` | El backend no está corriendo o usa otro puerto | `npm run dev` en `backend/` y revisar que `PORT` sea igual al `target` del proxy |
| Error de CORS en la consola del navegador | Se abrió el front con otro comando, o se puso la URL completa (`http://localhost:3000`) en `apiUrl` | Usar `npm start` y dejar `apiUrl: '/api/v1'` |
| Los cambios en `proxy.conf.json` no se aplican | El proxy se lee solo al arrancar | Detener y volver a correr `npm start` |
| 500 en el catálogo | El backend no conecta a MySQL | Ver la consola de `npm run dev` (ver la tabla de errores de la entrada de Postman) |

**En producción** el proxy de `ng serve` no existe. Ahí habrá que servir front y back detrás del mismo dominio (por ejemplo, con el servidor SSR de Angular o un Nginx que reenvíe `/api`) o habilitar CORS en Express. Queda pendiente para cuando se defina el despliegue.

---

## 2026-10-26 — README del repositorio

**Ubicación:** `README.md` (raíz del repositorio)

| Qué se hizo | Para qué sirve | Por qué |
|---|---|---|
| Se creó `README.md` **solo con las instrucciones de arranque**: requisitos (Node 22+, MySQL 8), orden de los scripts SQL, `.env` del backend, `npm run dev`, `npm start` del frontend y cómo correr las pruebas | Que cualquier miembro del equipo levante el proyecto sin preguntar | GitHub muestra el `README.md` de la raíz en la página principal del repositorio. Se dejó corto a propósito; los detalles y el porqué de cada decisión están en esta bitácora |

---

## 2026-10-26 — Ejecutar la base de datos con XAMPP y DBeaver

**Ubicación:** `README.md` (sección "Base de datos")

### Qué se hizo

Se agregaron al README los pasos para XAMPP + DBeaver, que son las herramientas del equipo (`TechnologyStacks.md` menciona DBeaver):

1. XAMPP Control Panel → **Start** en **MySQL**. XAMPP trae MariaDB, que es compatible con MySQL y con `mysql2`.
2. DBeaver → nueva conexión **MySQL/MariaDB**: `localhost:3306`, usuario `root`, contraseña vacía y *Database* vacío (la base todavía no existe).
3. Ejecutar `CarWeb.sql` y luego `seed_cars.sql` con **Alt + X** (*Ejecutar script*).
4. En `backend/.env`, `DB_PASSWORD` va vacío con XAMPP.

**Por qué Alt + X y no Ctrl + Enter:** Ctrl + Enter ejecuta solo la sentencia donde está el cursor. Si se usa, se crea una sola tabla y no el esquema completo.

### Problema detectado (no corregido)

`sql/CarWeb.sql`, línea 3, dice `USE Cars;`, pero la base que se crea es `CarWeb` (línea 1). `seed_cars.sql` y el `.env` usan `CarWeb`. Con `USE Cars;` el script falla con `Unknown database 'Cars'`. Es un cambio local que no viene del repositorio. **No se corrigió** porque no se sabe si fue intencional. Debe decir `USE CarWeb;`.

### Errores comunes

| Error | Causa | Solución |
|---|---|---|
| MySQL no arranca en XAMPP, "puerto 3306 en uso" | Hay otro MySQL instalado y encendido | Detenerlo desde *Servicios* de Windows o cambiar el puerto (y `DB_PORT` en `.env`) |
| `Unknown database 'Cars'` | La línea `USE Cars;` | Cambiarla por `USE CarWeb;` |
| `Public Key Retrieval is not allowed` (DBeaver) | Configuración del driver de MySQL 8 | Propiedades del driver → `allowPublicKeyRetrieval = true` |
| Solo se creó una tabla | Se ejecutó con Ctrl + Enter | Ejecutar con Alt + X |
| `Access denied for user 'root'` en el backend | `DB_PASSWORD` no coincide | Con XAMPP, dejarlo vacío |

---

## 2026-10-26 — Corrección del seed: `TRUNCATE` → `DELETE`

**Ubicación:** `sql/seed_cars.sql` (inicio del archivo)

### Problema

Al ejecutar el seed en XAMPP (MariaDB) desde DBeaver:

```
SQL Error [1701] [42000]: Cannot truncate a table referenced in a foreign key constraint
(`carweb`.`carphotos`, CONSTRAINT `fk_carphotos_car` ...)
```

### Qué se cambió

| Antes | Después |
|---|---|
| `SET FOREIGN_KEY_CHECKS = 0;` + `TRUNCATE TABLE CarPhotos;` + `TRUNCATE TABLE Cars;` + `SET FOREIGN_KEY_CHECKS = 1;` | `DELETE FROM CarPhotos;` + `DELETE FROM Cars;` + `ALTER TABLE ... AUTO_INCREMENT = 1;` |

### Por qué

- MySQL y MariaDB **no permiten `TRUNCATE`** sobre una tabla a la que apunta una llave foránea (`CarPhotos.CarId → Cars.CarId`). Desactivar `FOREIGN_KEY_CHECKS` no es confiable para esto: depende de la versión y de cómo el cliente (DBeaver) maneja la sesión.
- `DELETE` sí respeta las llaves foráneas. Por eso se borra **primero la tabla hija** (`CarPhotos`) y después la padre (`Cars`), sin desactivar ningún chequeo.
- `ALTER TABLE ... AUTO_INCREMENT = 1` reinicia los contadores, como hacía `TRUNCATE`, para que los ids vuelvan a empezar desde 1.

### Avisos

- DBeaver puede mostrar *"Confirm dangerous query execution"* por los `DELETE` sin `WHERE`. Es esperado: hay que confirmar.
- Si en `Trades` hay operaciones que apuntan a esos autos, el `DELETE FROM Cars` fallará (la FK es `ON DELETE RESTRICT`). El seed está pensado para una base de pruebas sin operaciones.

---

## 2026-10-26 — Ejecutar la base de datos con MySQL Workbench

**Ubicación:** `sql/seed_cars.sql`, `README.md`

### Qué se hizo

| Cambio | Para qué sirve | Por qué |
|---|---|---|
| `seed_cars.sql`: `SET SQL_SAFE_UPDATES = 0;` antes de los `DELETE` y `= 1` después | El seed funciona en Workbench sin cambiar su configuración | Workbench trae el modo **Safe Updates** activado y bloquea los `DELETE` sin `WHERE` (*Error 1175*). El cambio solo afecta a la sesión actual y se vuelve a activar al terminar. En DBeaver y XAMPP no tiene efecto negativo |
| `README.md`: pasos para XAMPP **o** MySQL Server, conexión en DBeaver **o** Workbench, una tabla con el atajo de cada cliente para ejecutar el script completo, y el paso `CREATE DATABASE IF NOT EXISTS CarWeb;` | Arrancar con cualquiera de las herramientas del equipo | En Workbench el script completo se ejecuta con **Ctrl + Shift + Enter** (el rayo ⚡). **Ctrl + Enter** ejecuta solo la sentencia del cursor |

### Problema detectado (no corregido)

La nueva versión de `CarWeb.sql` (cambiada por el equipo: tabla `User`, `SpareParts`, etc.) empieza con `USE CarWeb;` y **ya no tiene `CREATE DATABASE`**. En una instalación nueva falla con `Unknown database 'CarWeb'`. No se modificó porque es un archivo del equipo. El README indica crear la base a mano primero. Lo ideal es que el script vuelva a empezar con `CREATE DATABASE IF NOT EXISTS CarWeb;`.

El seed sigue siendo compatible con el esquema nuevo: las tablas `Cars` y `CarPhotos` no cambiaron.

### Errores comunes en Workbench

| Error | Causa | Solución |
|---|---|---|
| `Error Code: 1175. You are using safe update mode` | Safe Updates activado | Ya resuelto en el seed. Si aparece en otro script: Edit → Preferences → SQL Editor → desmarcar *Safe Updates* y reconectar |
| `Error Code: 1049. Unknown database 'CarWeb'` | No se creó la base | `CREATE DATABASE IF NOT EXISTS CarWeb;` |
| Solo se ejecutó una sentencia | Se usó Ctrl + Enter | Usar Ctrl + Shift + Enter (rayo ⚡) |
| No conecta / el puerto 3306 está ocupado | XAMPP y MySQL Server encendidos a la vez | Usar solo uno de los dos |
| `Access denied for user 'root'` en el backend | `DB_PASSWORD` en `.env` distinto a la contraseña de MySQL Server | Poner la misma contraseña con la que se entra en Workbench |

---

## 2026-10-26 — Base de datos local creada y prueba de punta a punta

### Entorno verificado

| Qué | Estado |
|---|---|
| MySQL Server | 8.0.46, servicio de Windows `MySQL80` con arranque automático, puerto 3306 |
| MySQL Workbench | 8.0 instalado |
| XAMPP | Instalado en `D:\xampp` pero **apagado** (no debe encenderse junto con MySQL80: los dos usan el puerto 3306) |
| `backend/.env` | Existe y sus credenciales conectan con MySQL |

### Qué se hizo

1. `CREATE DATABASE IF NOT EXISTS CarWeb;`. Hizo falta porque la versión actual de `CarWeb.sql` no crea la base.
2. Se ejecutó `sql/CarWeb.sql` y quedaron 8 tablas: `user`, `cars`, `spareparts`, `carphotos`, `trades`, `receipt`, `stockmovement`, `document`.
3. Se ejecutó `sql/seed_cars.sql`: **28 autos** (24 disponibles) y **81 fotos**.

**Cómo:** con un script temporal de Node (`mysql2` + `dotenv`) que lee las credenciales de `backend/.env` y ejecuta los dos archivos SQL tal cual. Así la contraseña no aparece en ningún comando. El script se borró al terminar; no queda ningún archivo nuevo en el proyecto.

### Verificación contra la base real

| Prueba | Resultado |
|---|---|
| Colección de Postman ejecutada con `newman` (Postman por línea de comandos) | **11 peticiones, 28 verificaciones, 0 fallos** |
| `GET /api/v1/cars` | Página 1 con 20 autos, del más nuevo al más viejo, con su foto principal |
| `GET http://localhost:4200/api/v1/cars?page=2` (por el proxy del frontend) | Página 2 de 2, con los 4 autos restantes. **El front recibe datos reales del back** |
| `GET .../cars/27` (Nissan Kicks, "Reserved") | `isAvailable: false`, así que el detalle muestra el aviso de no disponible |
| `http://localhost:4200/cars` | 200 |

### Para volver a levantarlo

- MySQL80 arranca solo con Windows.
- Terminal 1: `cd CarWebCode/backend && npm run dev`.
- Terminal 2: `cd CarWebCode/frontend && npm start`.
- Abrir `http://localhost:4200/cars`.

Para volver a dejar los autos de prueba como al principio, basta con ejecutar otra vez `seed_cars.sql`.

---

## 2026-10-27 — Arreglo del merge del equipo y HTML movidos a Angular

### Contexto

Se mezcló el PR #28 (`24-user-view-a-cars-details-16-User-Filter-Cars-By-Brand-And-Model`), con registro de usuarios, `cors`, Sequelize y pruebas del servidor. Los conflictos del merge se resolvieron **pegando las dos versiones una debajo de la otra**, así que varios archivos quedaron con código duplicado y el backend no arrancaba. Además, el registro se hizo como HTML/JS sueltos en la raíz de `frontend/`, fuera de Angular.

### Backend: errores corregidos

| Archivo | Error | Arreglo |
|---|---|---|
| `package.json` | JSON inválido: faltaba una coma después de `mysql2`, que aparecía dos veces. `vitest` y `supertest` estaban también en `dependencies` | Se dejó un solo `mysql2` y las herramientas de prueba solo en `devDependencies`. Se mantuvieron `bcryptjs`, `cors` y `sequelize` del equipo |
| `src/server.ts` | La clase estaba dos veces: el segundo constructor y el segundo `start()` quedaron fuera de la clase (error de sintaxis) | Una sola clase. Configura todo en el constructor (para las pruebas) e incluye el `cors()` del equipo **antes** de las rutas, más `notFoundHandler` y `errorHandler` |
| `src/routes/index.ts` | Mezcla de dos versiones: código suelto dentro de la clase `AppRoutes`, un `export default` en medio y `/cars` del equipo montado dos veces | Se mantuvo la clase `AppRoutes` del equipo (la usa `app.ts`) con el orden: rutas del inventario (US-20) → catálogo (US-03/05) → `/users` |
| `tests/app.test.ts` | Dos archivos de prueba pegados, con imports duplicados. Además, el `vi.mock('../src/server.ts')` del equipo reemplaza `Server` en **todo** el archivo, lo que rompía la prueba del 404 | Se separaron: `app.test.ts` queda con la prueba del equipo (arranque de `app.ts`) y la del 404 pasa a `tests/server.test.ts` |
| `tests/cars.test.ts` | Estaba otra vez en la papelera | Restaurado (versión sin historial de servicio) |
| `controllers/userController.ts` | `SELECT ... FROM user` e `INSERT INTO User` (distinto uso de mayúsculas) | Ahora los dos usan `User`. En Windows funciona igual, pero en Linux MySQL distingue mayúsculas en los nombres de tabla y fallaría |
| `conf/sequelize.connection.ts` | No usaba `DB_PORT` | Se agregó `port: Number(DB_PORT)`. Sin esto, con un puerto distinto de 3306 Sequelize no conectaría |

### Frontend: HTML movidos a su lugar

| Antes | Después | Por qué |
|---|---|---|
| `frontend/register.html` + `register.js` + `register.css` (HTML/JS sueltos, fuera de Angular) | `src/app/pages/register/register.component.{ts,html,css}` + ruta `/register` | Esos archivos no los sirve Angular, así que la página no era accesible desde la app. Ahora es una página más, con formulario reactivo (`ReactiveFormsModule`): campos obligatorios, correo válido, contraseña de 8+ caracteres y confirmación |
| `fetch("http://localhost:3000/api/v1/users/register")` en `register.js` | `services/user.service.ts` → `POST /api/v1/users/register` (con `environment.apiUrl`) | Usa el proxy como el resto de la app. No queda una URL fija a `localhost:3000` |
| — | `models/user.model.ts` (`RegisterUserRequest`, `RegisterUserResponse`) | Tipos del cuerpo y la respuesta del endpoint |
| `register.js` leía `datos.mensaje` | Se lee `message` | **Bug:** el backend responde `message`, no `mensaje`. Con el JS original, el mensaje de éxito salía vacío y los errores del backend ("Ya existe una cuenta…") nunca se mostraban |
| `frontend/login.html` (vacío) | `src/app/pages/login/login.component.*` + ruta `/login`, con un marcador "Próximamente" y enlace a registro | El botón "Iniciar sesión" de la home navegaba a `/login`, pero la ruta no existía y regresaba al inicio. El formulario real es la historia "Log in" |
| `components/Search-Bar/SearchBar.component.html` (vacío) | `components/search-bar/search-bar.component.{ts,html,css}` (vacío, sin usar) | Nombre según el formato del proyecto (`nombre-en-kebab.component.*`). Queda listo para el filtro por marca y modelo (US-04) |
| Textos en inglés en el formulario de registro | Textos en español | Para ser consistente con el resto de la app y con los mensajes del backend |
| — | `pages/register/register.component.spec.ts` (4 pruebas) | Campos vacíos, contraseñas distintas, envío correcto y error del backend |

**Nota sobre git:** Windows no distingue mayúsculas, así que `Search-Bar` y `search-bar` son la misma carpeta. Al hacer commit, git puede mostrar el cambio de nombre de forma rara. Si pasa, conviene `git mv` en dos pasos (a un nombre temporal y luego al final).

### Bitácora

Este archivo había desaparecido del disco: quedó guardado en el commit de merge `bf9a27e` de la rama `17-user-log-in2`, y al volver a `Development` (donde no existe) git lo quitó. Se recuperó leyendo esa versión con `git show`, sin cambiar ramas ni commits. **Para que no vuelva a pasar, `Documentation/Info.md` tiene que estar en `Development`.**

### Verificación

- Backend: `tsc` sin errores; `npm test` → **3 archivos, 14 pruebas**, todas pasan.
- Frontend: `ng build` sin errores (prerenderiza `/`, `/register` y `/login`); `ng test` → **5 archivos, 15 pruebas**, todas pasan.
- De punta a punta con MySQL real, por el proxy (`localhost:4200`):
  - Registro nuevo → 201 `Usuario registrado correctamente.`; en la base, la contraseña queda **hasheada** (bcrypt).
  - El mismo correo otra vez → 409 `Ya existe una cuenta con ese correo.`
  - El catálogo sigue funcionando; `/register`, `/login` y `/cars` → 200.
  - El usuario de prueba se borró de la base al terminar.

### Pendientes para el equipo

- Resolver los merges eligiendo **una** versión de cada bloque en conflicto, no pegando las dos.
- `validators/user.ts` y `dtos/users/CreateUserDto.ts` siguen vacíos. La validación del registro está dentro del controlador.
- Sequelize se conecta al arrancar (`connect()` + `sync()`), pero todavía no hay modelos. El resto del backend usa `mysql2` directo.
- Hay que confirmar si la rama `17-user-log-in2` tiene trabajo de login que todavía no está en `Development`.

---

## 2026-10-27 — Arreglo del login (frontend + backend)

### Qué estaba mal

**Frontend** (`pages/login/login.component.ts`, código del equipo):

| Problema | Efecto |
|---|---|
| La clase se llamaba `App`, con selector `app-root`, `templateUrl: './app.html'` y `styleUrl: './app.css'` | No compilaba: la ruta `/login` importa `LoginComponent`, y `app.html`/`app.css` no existen en esa carpeta. Además, `app-root` choca con el componente raíz de la app |
| URL fija `http://localhost:3000/api/users/login` | Faltaba `/v1`, así que el backend respondía 404. Además, al saltarse el proxy dependía de CORS |
| `HttpClientModule` en `imports` | Está obsoleto en Angular moderno, y el `HttpClient` ya lo provee `app.config.ts` |
| `ChangeDetectorRef.detectChanges()` a mano y `*ngIf` | Funcionaba, pero no es el estilo del resto del proyecto (signals y `@if`) |

**Backend:** **no existía el endpoint de login** en `Development`. En la rama `17-user-log-in2` había un `user.routes.ts` con `/login`, pero no funcionaba:
- Consultaba la tabla `employee`, que ya no existe. El esquema actual tiene una sola tabla `User` con columna `role`.
- Importaba `bcrypt`, que no está instalado (el proyecto usa `bcryptjs`), y `dbConnection`, que no existe (se llama `pool`).
- No estaba montado en ninguna ruta.

### Qué se hizo

| Archivo | Cambio | Por qué |
|---|---|---|
| `backend/src/controllers/userController.ts` | Nueva función `iniciarSesion`: valida `email` y `password`; busca en `User` por correo (`trim` + minúsculas, igual que el registro); verifica `IsActive` y compara con `bcrypt.compare`; responde `{ ok, message, user: { id, name, email, role } }` | Va junto a `registrarUsuario`, en el mismo estilo del equipo. Nunca devuelve el hash de la contraseña |
| (misma función) | Correo inexistente, contraseña incorrecta o cuenta inactiva dan **el mismo** 401 `Correo o contraseña incorrectos.` | Criterio de la historia *Log in*: un mensaje genérico que no revela qué campo estaba mal |
| `backend/src/routes/userRoutes.ts` | `router.post("/login", iniciarSesion)` → `POST /api/v1/users/login` | Montado junto a `/register` |
| `frontend/.../models/user.model.ts` | `LoginRequest`, `LoggedUser`, `LoginResponse` | Tipos del contrato |
| `frontend/.../services/user.service.ts` | Método `login()` | Usa `environment.apiUrl` y el proxy, como el resto |
| `frontend/.../pages/login/login.component.ts` | Ahora es `LoginComponent` (`app-login`, archivos `login.component.*`). Usa signals para `mensaje`, `exito` y `cargando`, y `finalize` para reactivar el botón | Compila, encaja con la ruta y sigue el estilo del proyecto |
| `frontend/.../pages/login/login.component.html` | **Se mantuvo el diseño del equipo** (tarjeta oscura, logo "CW"). Cambios: `@if` en vez de `*ngIf`, el mensaje de éxito en otro color, `autocomplete` en los campos, placeholder `correo@ejemplo.com`, y el pie "Acceso exclusivo para empleados" pasó a ser **"¿No tienes cuenta? Regístrate"** | Ahora el login es para todos los usuarios de la tabla `User` (clientes, empleados y gerente). Un cliente recién registrado necesita poder entrar |
| `frontend/.../pages/login/login.component.css` | Se agregaron `.mensaje--exito` y el color del enlace del pie | El resto del CSS del equipo queda igual |
| `frontend/.../pages/login/login.component.spec.ts` | 2 pruebas: envío correcto (URL, cuerpo, mensaje de éxito) y error 401 genérico | Verificación automática |

### Verificación

- Backend: `tsc` sin errores; `npm test` → 14 pruebas pasan.
- Frontend: `ng build` sin errores; `ng test` → **6 archivos, 17 pruebas**, todas pasan.
- De punta a punta con MySQL, por el proxy (`localhost:4200/api/v1/users/login`), con un usuario de prueba (borrado al terminar):

| Caso | Respuesta |
|---|---|
| Credenciales correctas | 200 `Inicio de sesión exitoso.` con `{ id, name, email, role: "client" }` |
| Correo en mayúsculas y con espacios | 200 (se normaliza igual que en el registro) |
| Contraseña incorrecta | 401 `Correo o contraseña incorrectos.` |
| Correo inexistente | 401 `Correo o contraseña incorrectos.` (el mismo mensaje) |
| Cuerpo vacío | 400 `El correo y la contraseña son obligatorios.` |

### Pendiente (no incluido, son partes de la historia *Log in* / `Security.md`)

- **Sesión:** hoy el login solo valida y responde. No hay token ni sesión, así que el resto de la app no "sabe" quién entró. Falta elegir el mecanismo (JWT o sesión con cookie).
- **Bloqueo** de 15 minutos tras 3 intentos fallidos. Requiere una columna de intentos o de bloqueo en `User`.
- **Menú según el rol** (User / Employee / Manager) después de entrar.
- La rama `17-user-log-in2` sigue teniendo su `user.routes.ts` roto. Conviene no mezclarlo, o borrarlo al integrar.

---

## 2026-11-02 — Todo el código en inglés

### Regla nueva (indicación del usuario)

**Todo el código va en inglés** para que sea uniforme: nombres de variables y funciones, comentarios, textos de la interfaz, mensajes de la API, datos y expectativas de las pruebas, comentarios SQL y Postman. Al modificar un archivo que tenga español, se traduce. **La documentación** (esta bitácora y el `README.md`) sigue en español.

### Qué se tradujo

| Archivo | Cambios |
|---|---|
| `backend/src/controllers/userController.ts` | Funciones `registrarUsuario` → `registerUser` e `iniciarSesion` → `loginUser`. Los mensajes de la API pasan a inglés: `"Name, Email and Password are required."`, `"The email address is not valid."`, `"The password must be at least 8 characters long."`, `"An account with that email already exists."`, `"User registered successfully."`, `"Invalid email or password."`, `"Login successful."`, `"Email and password are required."` y los de error interno. También los `console.error` |
| `backend/src/routes/userRoutes.ts` | Imports con los nombres nuevos |
| `frontend/.../pages/login/login.component.{ts,html,css}` | `mensaje` → `message`, `exito` → `isSuccess`, `cargando` → `isLoading`, `iniciarSesion()` → `login()`, `respuesta` → `response`. Clases CSS `.mensaje` → `.message` y `.mensaje--exito` → `.message--success`. Textos: "Vehicle management system", "Email", "Password", "Log in", "Verifying...", "Don't have an account? Sign up" |
| `frontend/.../pages/register/register.component.{ts,html}` | Textos de vuelta al inglés, como los tenía originalmente el equipo ("Create an Account", "Full Name", "Phone Number", "Register"…), y los mensajes de validación ("Please fill in the required fields.", "Passwords do not match.") |
| `frontend/.../pages/car-catalog/car-catalog.component.html` | "Car catalog", "Loading cars…", "Try again", "There are no cars available right now.", "← Previous / Page X of Y / Next →" |
| `frontend/.../pages/car-detail/car-detail.component.html` | Aviso de no disponible, botones "Schedule appointment" / "Buy" y la ficha técnica (Brand, Model, Year, Version, Series, Mileage, Fuel type, Transmission, Color, Tire condition) |
| `frontend/.../pages/home/home.component.html` | "Welcome to CarWeb.", "View catalog", "Log in" |
| `frontend/src/app/app.routes.ts` | Títulos de pestaña: "Catalog", "Car details", "Sign up", "Log in" |
| `frontend/src/assets/images/car-placeholder.svg` | "Photo not available" |
| `frontend/src/app/app.config.ts` | Se quitó el idioma `es-MX` (`LOCALE_ID` + `registerLocaleData`); queda el predeterminado de Angular, `en-US`, que coincide con la interfaz en inglés. La moneda sigue en **MXN**, y precios y kilometraje se ven igual (`$255,000`, `45,200 km`) |
| Pruebas `*.spec.ts` del frontend | Textos esperados en inglés y datos de prueba (`John Smith`, `john@example.com`, `secret123`) |
| `sql/seed_cars.sql` | Comentarios en inglés. Modelos `Serie 3` → `3 Series` y `Clase C` → `C-Class` (sus nombres comerciales en inglés). Se volvió a ejecutar el seed en la base local |
| `backend/postman/` (workspace del equipo) | `Registrar Usuario.request.yaml` → `Register User.request.yaml`, con la descripción traducida; la descripción de la colección; y en el entorno `Juan Pérez` → `John Smith` |

**Sin cambios:** `index.html` ya tenía `lang="en"`. `errorHandler`, `HttpError`, el catálogo del backend y los controladores del equipo ya estaban en inglés.

### Verificación

- Backend: `tsc` sin errores; `npm test` → 14 pruebas pasan.
- Frontend: `ng build` sin errores; `ng test` → 17 pruebas pasan.
- API real: `POST /users/login` vacío → `"Email and password are required."`; credenciales malas → `"Invalid email or password."`; registro con correo inválido → `"The email address is not valid."`.
- Base de datos: el seed se ejecutó de nuevo (los autos 19 y 21 ahora son `3 Series` y `C-Class`).

### Aviso

La colección `CarWeb-US03-US05.postman_collection.json` y su carpeta `CarWebCode/postman/` están en la **papelera de Windows** (se borraron el 2026-10-27 a las 20:17). El equipo ahora usa el workspace de Postman en `backend/postman/`. No se restauró por si el borrado fue intencional. Si se quiere recuperar, hay que pasarla a inglés y moverla a `backend/postman/`.

---

## 2026-11-02 — Logos y paleta de colores de CarWeb

### Paleta (`frontend/src/styles.css`)

Los colores se definieron como **variables CSS globales**, con los mismos nombres de la paleta entregada. El proyecto usa CSS normal, no Tailwind, así que la paleta se tradujo a `--color-*`:

| Variable | Valor | Uso |
|---|---|---|
| `--color-graphite` | `#26292C` | Texto principal; fondo del login |
| `--color-inferno` | `#AF0E08` | Color principal: botones, enlaces, precios |
| `--color-inferno-dark` | `#8C0B06` | Hover de botones; texto de avisos |
| `--color-inferno-tint` | `#FBE9E8` | Fondo de avisos y errores |
| `--color-ash` | `#96B0AD` | Bordes y foco en el login; texto de éxito sobre fondo oscuro |
| `--color-ash-deep` | `#4F6866` | Texto secundario; bordes de los campos de formulario |
| `--color-slate` | `#B9B5BA` | Texto claro sobre fondo oscuro; bordes decorativos |
| `--color-slate-light` | `#ECEAED` | Fondo de imágenes, placa del ícono en el login |
| `--color-page` | `#F7F7F8` | Fondo de página |

Además se crearon **alias semánticos** (`--color-primary`, `--color-primary-hover`, `--color-text`, `--color-text-muted`, `--color-surface`, `--color-border`, `--color-border-strong`). Los componentes usan los alias, así que un cambio de marca se hace en un solo lugar.

**Por qué:** antes cada componente tenía sus propios colores fijos (azul `#1d4ed8`, grises de Tailwind, azules en el registro, rojos parecidos en el login). Ahora toda la app usa una sola paleta. Solo quedan fijos el blanco (`#ffffff`) y las sombras negras, que son neutros.

**Contraste verificado (WCAG AA, mínimo 4.5:1 para texto):** graphite/page 13.7 · ash-deep/blanco 6.0 · inferno/blanco 7.3 · blanco sobre inferno 7.3 · inferno-dark/inferno-tint 8.3 · slate sobre graphite 7.2. Dos combinaciones **no** pasaban y se evitaron:
- `slate` como borde de campos sobre blanco: 2.0, cuando el mínimo para bordes es 3:1. Los campos usan `ash-deep` (6.0).
- Líneas negras del logo (`#16161A`) sobre graphite: 1.2, invisibles. En el login el ícono va sobre una placa `slate-light` (15.1).

### Logos (`frontend/src/assets/images/`)

| Archivo | Dónde se usa |
|---|---|
| `carweb-icon.svg` | **Favicon** (`public/favicon.svg`, enlazado en `index.html`) e ícono del login sobre una placa clara (reemplaza el "CW") |
| `carweb-logo.svg` | Página de inicio (logo grande dentro de la tarjeta) |
| `carweb-logo-horizontal.svg` | Encabezado nuevo del sitio y parte superior del registro |

### Otros cambios

| Archivo | Cambio | Por qué |
|---|---|---|
| `components/site-header/` (nuevo) | Barra superior con el logo horizontal (enlace al inicio) y los enlaces **Catalog** y **Log in**; el enlace de la página actual se resalta (`routerLinkActive`) | El catálogo y el detalle no tenían navegación ni marca. No se usa en login y registro, que son pantallas completas con su propio diseño |
| `pages/car-catalog`, `pages/car-detail` | Incluyen `<app-site-header />` | — |
| `index.html` | `<title>CarWeb</title>` (antes "Frontend"), `favicon.svg` y `theme-color` graphite | La pestaña del navegador muestra el nombre y el ícono de CarWeb |
| `public/favicon.ico` | Eliminado | Era el logo de Angular |
| `assets/images/car-placeholder.svg` | Colores de la paleta (slate-light, slate, ash-deep) | Coherencia visual |
| `pages/login/login.component.css` | Colores fijos → variables. La tarjeta usa graphite aclarado un 6% (`color-mix`), en lugar del `#303538` fuera de la paleta. El mensaje de error pasa a ser una "pastilla" `inferno-tint` con texto `inferno-dark`, en lugar del rosa `#FF8B85` | Se mantuvo el diseño oscuro del equipo, ahora con colores de la paleta |
| `pages/register/register.component.css` | Azules y grises → variables de la paleta | El registro tenía su propia paleta azul |

### Verificación

- `ng build` sin errores; los cuatro SVG se copian a `dist/.../assets/images/`. `ng test` → 17 pruebas pasan.
- Se tomaron **capturas** de inicio, login, registro, catálogo y detalle (Edge headless, con backend y MySQL reales): logos nítidos, ícono visible en el login y botones y precios en `inferno`.

### Nota

El rojo del texto de los logos es `#D3202F`, que **no** está en la paleta (`inferno` es `#AF0E08`). Los SVG se dejaron tal como se entregaron. Si se quiere unificar, hay que cambiar el `fill` de los logos a `#AF0E08`.

---

## 2026-11-02 — Home con header y footer

### Qué se hizo

La home ahora se arma con componentes: **header → contenido → footer**. El footer siempre queda al fondo de la ventana, aunque haya poco contenido.

### Header (`components/site-header/`)

Contiene, **en este orden**:

| # | Elemento | Detalle |
|---|---|---|
| 1 | Logo | `carweb-logo-horizontal.svg`, enlace al inicio |
| 2 | Barra de búsqueda | Componente propio, `<app-search-bar>` (ver abajo) |
| 3 | Botón **Catalog** | Enlace a `/cars` con estilo de botón secundario (borde rojo). Se resalta cuando estás en el catálogo |
| 4 | Botón **Log in** | Enlace a `/login` con estilo de botón principal (rojo lleno) |
| 5 | Sidebar de acceso rápido | Componente propio, `<app-quick-access-sidebar>` (ver abajo) |

Catalog y Log in son **enlaces con estilo de botón** (`<a>`), no `<button>`: lo que hacen es navegar, y así funcionan "abrir en otra pestaña" y los lectores de pantalla los anuncian como enlaces.

**Responsive:**
- Por debajo de 760 px, la barra de búsqueda pasa a su propia fila, debajo del logo y los botones.
- Por debajo de 480 px, el logo y los botones se achican para que todo quepa en la primera fila a 360 px.
- Verificado sin desplazamiento horizontal a 320, 360 y 400 px.

Como el header ya se usaba en el catálogo y el detalle, esas páginas también tienen ahora la búsqueda, los botones y el sidebar.

### Barra de búsqueda (`components/search-bar/`)

- Campo `type="search"` con etiqueta oculta para lectores de pantalla ("Search cars") y botón de lupa (`aria-label="Search"`). Se envía con Enter o con el botón.
- Emite el término **sin espacios al inicio y al final** (`output search`) e **ignora búsquedas vacías**. El placeholder se puede configurar (`input placeholder`, por defecto "Search by brand or model").
- El header, al recibir la búsqueda, navega a `/cars?search=<término>`.
- **Pendiente:** el catálogo **todavía no filtra** por ese parámetro. El filtro por marca y modelo es la **US-04** y necesita soporte en el backend.

### Sidebar de acceso rápido (`components/quick-access-sidebar/`)

- Botón de menú (☰) que abre un panel lateral desde la derecha, con fondo oscurecido.
- Enlaces reales: **Home, Catalog, Log in, Sign up**.
- Placeholders con la etiqueta **"Soon"** (no son enlaces): *My appointments*, *Sell my car*, *Spare parts*. Corresponden a historias todavía no implementadas.
- **Accesibilidad:** `aria-expanded` y `aria-controls` en el botón. Se cierra con **Esc**, con clic en el fondo, con el botón ✕ o al elegir un enlace. Al abrir, el foco pasa al botón ✕; al cerrar, vuelve al botón ☰.
- El panel solo se crea cuando está abierto (`@if`), así que cerrado no se puede llegar a él con Tab.

### Footer (`components/site-footer/`)

- Logo horizontal (enlace al inicio).
- Columnas **placeholder**: *Company*, *Services* y *Support* con "Placeholder link", *Contact* con dirección, teléfono y correo de ejemplo, y una descripción de ejemplo. Son texto, no enlaces, para que no haya enlaces que no lleven a ningún lado.
- Copyright: `© <año actual> CarWeb. All rights reserved.` (el año se calcula solo).
- Fondo `slate-light`, porque las líneas negras del logo no se ven sobre fondos oscuros.

### Home (`pages/home/`)

- Ya no usa `CardComponent` ni `ButtonComponent`, ni tiene los métodos `goToCatalog()`/`goToLogin()`: esas acciones ahora están en el header.
- Contenido: logo grande, "Welcome to CarWeb", una frase y un botón **Browse the catalog**.

### Otros

- `styles.css`: nueva clase global `.visually-hidden`, para etiquetas que solo leen los lectores de pantalla.

### Verificación

- `ng build` sin errores; `ng test` → **9 archivos, 25 pruebas** (8 nuevas):
  - `search-bar`: emite el término recortado, ignora vacíos, la etiqueta está asociada al campo.
  - `quick-access-sidebar`: cerrado por defecto; abre con sus enlaces y placeholders; cierra con Esc y con el fondo.
  - `site-header`: el orden de los elementos es el pedido; la búsqueda navega a `/cars?search=…`.
- Capturas reales con `puppeteer-core` + Edge, en el scratchpad y **no** en el proyecto: escritorio 1280 px, móvil 320/360/400 px (sin desbordamiento) y sidebar abierto (el foco queda en ✕).

---

## 2026-11-02 — Login con el mismo estilo que Sign up

### Problema

Las páginas de **Log in** y **Sign up** tenían diseños distintos: el login era una tarjeta oscura (graphite), con el ícono en una placa y el título "CarWeb", y el registro una tarjeta blanca sobre fondo claro, con el logo horizontal. Cada una tenía su propio archivo CSS, así que con el tiempo se iban a separar más.

### Qué se hizo

| Archivo | Cambio | Por qué |
|---|---|---|
| `pages/auth-form.css` (nuevo) | Hoja de estilos **compartida** por las dos páginas, tomada del registro. La clase contenedora se llama `.auth-card` (antes `.register-container`) | Un solo lugar para el diseño de las pantallas de autenticación. Si se cambia, cambian las dos |
| `pages/register/register.component.css` y `pages/login/login.component.css` | **Eliminados**. Los dos componentes usan `styleUrl: '../auth-form.css'` | Ya no hay estilos duplicados ni divergentes |
| `pages/login/login.component.html` | Misma estructura que el registro: logo horizontal (enlace al inicio), título **"Log in"**, subtítulo **"Welcome back to CarWeb"**, campos con etiqueta en negrita, botón rojo de ancho completo, mensaje y el enlace "Don't have an account? Sign up" | Las dos páginas se ven y se recorren igual |
| (mismo archivo) | El mensaje usa las mismas clases que el registro: `.message` + `.success` / `.error`, en vez de `.message--success`. El párrafo está siempre en la página (`aria-live="polite"`), así los lectores de pantalla anuncian el resultado | Mismo comportamiento y mismo estilo de mensajes en las dos páginas |
| `pages/register/register.component.html` | `class="register-container"` → `class="auth-card"` | Nombre genérico, porque lo usan las dos |
| `pages/login/login.component.spec.ts` | Selectores `.message--success` → `.message.success` | Acompaña el cambio de clases |
| `pages/auth-form.css` | `font-family: inherit` en campos y botón | Los navegadores ponen Arial por defecto en `input`/`button`. Ahora usan la misma fuente que el resto de la app |

**Ya no se usa:** el diseño oscuro del login, la placa con el ícono y la sombra/borde `ash` de la tarjeta oscura. El ícono sigue en uso como favicon.

### Verificación

- `ng build` sin errores; `ng test` → 25 pruebas pasan.
- Capturas de `/login` y `/register` a 1280 px: misma tarjeta, logo, tipografía, campos y botón.

---

## 2026-11-02 — Barra de búsqueda: backend (US-04) y conexión con el catálogo

### Criterios de la US-04 y cómo se cumplen

| Criterio | Cómo |
|---|---|
| Filtrar por marca, por modelo o por ambos | Parámetros `brand` y `model` (exactos), y `search` (texto libre que busca en marca **y** modelo) |
| Solo autos disponibles que coincidan | Los filtros se **suman** a la condición del catálogo (`StatusOfCar = 'Available'` e `InventoryStatus = TRUE`) |
| Ignora mayúsculas y acentos | Lo hace la *collation* de las columnas: `utf8mb4_0900_ai_ci` en MySQL 8 (la de la base local, verificado) o `utf8mb4_unicode_ci`. `ai` = *accent insensitive*, `ci` = *case insensitive* |
| "No cars match your search" y poder limpiar el filtro | Mensaje en el catálogo con el enlace **Clear search** |

### API

`GET /api/v1/cars?page=N&search=…&brand=…&model=…` (todos opcionales y combinables con la paginación)

| Parámetro | Comportamiento |
|---|---|
| `search` | Se separa en palabras y **cada palabra** tiene que aparecer en la marca o en el modelo (`LIKE %palabra%`). "toyota corolla" → Toyota Corolla; "COROLLA toyota" → igual; "mazda" → todos los Mazda |
| `brand` / `model` | Coincidencia exacta (sin importar mayúsculas ni acentos). Pensados para filtros con listas desplegables más adelante |
| Vacíos o solo espacios | Se ignoran |
| Más de 100 caracteres | 400 `"<campo> must be at most 100 characters"` |
| Repetidos (`?brand=a&brand=b`) | 400 `"<campo> must be a single text value"` |

**Seguridad:** el texto siempre viaja como parámetro (`?`), nunca pegado al SQL. Además se **escapan** los comodines de `LIKE` (`%`, `_`, `\`): buscar "50%" busca literalmente "50%" y no "cualquier cosa que empiece con 50".

### Backend: archivos

| Archivo | Cambio |
|---|---|
| `src/repositories/carFilters.ts` (nuevo) | Interfaz `CarFilters`, `escapeLike()` y `buildCatalogCondition()`, que arma el `WHERE` y sus parámetros. Está separado del repositorio para poder probarlo **sin base de datos** |
| `src/repositories/car.repository.ts` | `findAvailable(filters, limit, offset)` usa `buildCatalogCondition`. La misma condición se usa para la página y para el `COUNT(*)`, así el total y las páginas respetan el filtro |
| `src/services/car.service.ts` | `listAvailable(page, filters = {})` pasa los filtros al repositorio |
| `src/validators/car.ts` | `parseCarFilters(query)`: recorta espacios, ignora vacíos y valida tipo y largo (`MAX_FILTER_LENGTH = 100`) |
| `src/controllers/car.controller.ts` | `GET /cars` lee y valida los filtros |
| `tests/carFilters.test.ts` (nuevo, 5 pruebas) | Condición sin filtros, marca y modelo, varias palabras, comodines escapados |
| `tests/cars.test.ts` (+5 pruebas) | Filtros recortados que llegan al repositorio, vacíos ignorados, 400 por largo y por repetidos |

### Frontend: conexión con la barra del header

| Archivo | Cambio |
|---|---|
| `services/car.service.ts` | `getCars(page, search?)` agrega `search` **solo** si hay término |
| `pages/car-catalog/car-catalog.component.{ts,html,css}` | Lee `?search=` de la URL (`input search`). Muestra **Results for "…"** con **Clear search**. Si no hay resultados: **"No cars match your search."** con **Clear search** (distinto de "There are no cars available", que es cuando el catálogo está vacío). La paginación conserva la búsqueda (`queryParamsHandling="merge"`) |
| `components/search-bar/search-bar.component.ts` | La salida se renombró de `search` a **`searchSubmit`** (ver el error abajo) |
| `components/site-header/site-header.component.html` | `(searchSubmit)="onSearch($event)"` |
| Pruebas | `car.service.spec` (+1), `car-catalog.component.spec` (+2), `site-header.component.spec` (+1, ver abajo) |

### Error encontrado y corregido: `search=[object Event]`

La prueba en un navegador real mostró que al buscar, la URL quedaba `/cars?search=[object Event]`.

**Causa:** la salida del componente se llamaba `search`, pero Chrome y Edge disparan un **evento nativo `search`** en `<input type="search">` al presionar Enter. Ese evento sube hasta `<app-search-bar (search)="…">`, y Angular lo trataba como la salida del componente, así que se enviaba el objeto `Event` en lugar del texto. Las pruebas unitarias no lo detectaban porque jsdom no dispara ese evento.

**Solución:** la salida ahora se llama `searchSubmit`, un nombre que no choca con ningún evento del navegador. Se agregó una prueba que dispara el evento nativo `search` y verifica que **no** se navegue.

### README

`CREATE DATABASE IF NOT EXISTS CarWeb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` (antes sin charset). En MySQL 8 la *collation* por defecto ya ignora acentos, pero en **XAMPP/MariaDB** no está garantizado. Con esto la búsqueda se comporta igual en las dos. Solo aplica a bases nuevas.

### Verificación

- Backend: `tsc` sin errores; `npm test` → **4 archivos, 24 pruebas**.
- Frontend: `ng build` sin errores; `ng test` → **9 archivos, 29 pruebas**.
- API contra MySQL real: "toyota" → 2; "MÁZDA" → 2 Mazda; "toyota corolla" y "COROLLA toyota" → Corolla; "cr-v" → CR-V; `brand=honda` → 2; `brand=Honda&model=civic` → Civic; "hilux" (vendido), "kicks" (reservado) y "spark" (refacciones) → 0; "50%" → 0; blanco → los 24; 101 caracteres → 400.
- Navegador real (Edge + puppeteer): búsqueda desde la barra de la home → catálogo filtrado; "xyz" → "No cars match your search." → Clear search → catálogo completo.

### Pendientes / avisos

- La barra del header **no muestra** el término actual cuando ya estás en `/cars?search=…`, porque cada página crea su propio header. Se ve arriba del listado ("Results for …").
- `pages/car-detail/car-detail.component.html` ya no tiene `<app-site-header />` (se quitó fuera de esta sesión), pero el `.ts` todavía importa `SiteHeaderComponent`. Angular avisa `NG8113` en el build. Si el cambio fue intencional, hay que quitar también el import; si no, volver a poner el header.

---

## 2026-11-02 — Se vuelve a poner el header en el detalle del auto

| Archivo | Cambio | Por qué |
|---|---|---|
| `frontend/src/app/pages/car-detail/car-detail.component.html` | Se agregó otra vez `<app-site-header />` en la primera línea | La línea se había quitado y el usuario pidió volver a ponerla. Sin ella, el detalle del auto no tenía logo, barra de búsqueda, botones *Catalog* / *Log in* ni menú de acceso rápido, a diferencia de la home y el catálogo. Además, el `.ts` seguía importando `SiteHeaderComponent` sin usarlo, y eso generaba el aviso `NG8113` en el build |

**Verificación:** `ng build` sin errores ni el aviso `NG8113`; `ng test` → 29 pruebas pasan. Con esto se cierra el pendiente de la entrada anterior.

---

## 2026-11-03 — Página de empleado

### Términos

- **Página de usuario:** la que ya existía (home, catálogo, detalle) para clientes y visitantes.
- **Página de empleado:** la nueva, exclusiva para empleados (`/employee`).

### Flujo

```
Página de usuario ──[botón fa-user-tie]──► /login ──(rol employee o manager)──► /employee (home de empleados)
                                                   └─(rol client)───────────────► /  (página de usuario)
```

### Qué se hizo

| Archivo | Cambio | Por qué |
|---|---|---|
| `frontend/package.json` + `angular.json` | Se instaló **`@fortawesome/fontawesome-free` 6**. En `styles` solo se cargan `fontawesome.min.css` y `solid.min.css` (≈57 KB de CSS y una fuente de ≈156 KB) | El ícono pedido es `fa-solid fa-user-tie`, del estilo *solid*. No se carga el paquete completo (`all.min.css`), que trae estilos que no se usan |
| `components/site-header/site-header.component.{html,css,ts}` | Se **quitó el botón *Log in*** y en su lugar va un **botón cuadrado rojo con `<i class="fa-solid fa-user-tie">`** que lleva a `/login` | Pedido del usuario. Como el botón solo tiene ícono, lleva `title="Employee access"` (tooltip) y un texto oculto para lectores de pantalla; el ícono va con `aria-hidden="true"`. Sin eso, un lector de pantalla no anunciaría nada útil |
| `services/auth.service.ts` (nuevo) | Guarda al usuario que inició sesión (`user`, `isEmployee`), con `login()` y `logout()`. Lo guarda en **`sessionStorage`** (clave `carweb.user`), así se mantiene al recargar la página y se borra al cerrar la pestaña | Hace falta para saber quién entró y si es empleado. Funciona con SSR: en el servidor no toca `sessionStorage` |
| `services/auth.service.ts` → `EMPLOYEE_ROLES` | Roles con acceso a la página de empleado: **`employee`** y **`manager`** (sin importar mayúsculas) | `Security.md` define los roles Customer, Employee y Manager. En la base solo existía `client` (el predeterminado), así que se usaron los nombres en minúscula, igual que `client` |
| `guards/employee.guard.ts` (nuevo) | `employeeGuard`: deja pasar a empleados y gerentes; a cualquier otro lo manda a `/login` | Que nadie llegue a la página de empleado escribiendo la URL o con sesión de cliente |
| `pages/login/login.component.ts` | Usa `AuthService`. Después de entrar redirige según el rol: empleado o gerente → **`/employee`**, cliente → **`/`** | Pedido: del login se pasa a la home de empleados. Los clientes vuelven a la página de usuario para no romper su flujo (el registro lleva a "Log in") |
| `pages/employee-home/` (nuevo) | Home de empleados con encabezado propio (logo, etiqueta **"Employee portal"**, nombre del empleado, **Log out**), "Welcome, \<nombre\>" y **7 tarjetas placeholder** con las historias de empleados (*Appointments, Test drives, Vehicle inspection, Register a purchase, Register a sale, Documents, Contracts*), cada una con su ícono de Font Awesome y "Coming soon". Usa el mismo footer | Base para las historias de `Documentation/UserStories/Employee`. Un encabezado distinto (borde rojo y etiqueta oscura) deja claro que es la página de empleado. *Log out* borra la sesión y vuelve al login |
| `app.routes.ts` | Ruta `employee` con `canActivate: [employeeGuard]` | — |
| `app.routes.server.ts` | `employee` con `RenderMode.Client` | La sesión vive en el navegador. Si se prerenderizara en el servidor, el guard vería siempre "sin sesión" y redirigiría |
| `guards/.gitkeep` | Eliminado | La carpeta ya tiene contenido |

### Pruebas nuevas (19)

- `auth.service.spec.ts`: guarda al usuario tras el login, lo recupera al recargar, lo borra con logout; `isEmployeeRole` para employee/Manager/client/undefined.
- `employee.guard.spec.ts`: deja pasar a employee y manager; manda a `/login` si no hay sesión o si es cliente.
- `employee-home.component.spec.ts`: saludo con el nombre, 7 tareas "Coming soon", logout borra la sesión y navega a `/login`.
- `login.component.spec.ts`: employee → `/employee`, manager → `/employee`, client → `/`.
- `site-header.component.spec.ts`: el botón de empleado tiene el ícono `fa-user-tie` y lleva a `/login`; ya no existe el botón "Log in".

### Verificación

- `ng build` sin errores; `ng test` → **12 archivos, 48 pruebas**.
- Navegador real (Edge + puppeteer) contra MySQL, con un empleado y un cliente de prueba (borrados al terminar):
  1. El header de la página de usuario muestra *Catalog* y el botón del ícono; ya no tiene *Log in*. El ícono carga con la fuente "Font Awesome 6 Free".
  2. Entrar a `/employee` sin sesión → `/login`.
  3. Botón de empleado → `/login` → login de empleado → `/employee` ("Welcome, Ana Test").
  4. F5 en `/employee` → sigue en `/employee`.
  5. *Log out* → `/login`; volver a `/employee` → `/login`.
  6. Login de cliente → `/`; el cliente intenta `/employee` → `/login`.

### Cómo dar acceso a un empleado

Todavía no hay pantalla para administrar empleados. Por ahora: registrar la cuenta normalmente (`/register`) y luego cambiarle el rol en la base:

```sql
UPDATE User SET role = 'employee' WHERE Email = 'correo@del-empleado.com';
-- o 'manager' para el gerente
```

### Avisos

- **La protección es solo del lado del navegador.** El backend todavía no emite sesión ni token, así que el guard decide qué páginas se muestran, pero **no protege la API**. Cuando la página de empleado consuma endpoints de empleados, el backend tendrá que validar el rol (JWT o sesión), como pide `Security.md`.
- El **menú de acceso rápido** (☰) todavía tiene el enlace *Log in*, igual que el pie del registro ("Already have an account? Log in"). Se dejaron para que los clientes puedan iniciar sesión; si el login debe ser solo para empleados, hay que quitarlos.

---

## 2026-11-03 — El botón de empleado enlaza a la home de empleados

| Archivo | Cambio | Por qué |
|---|---|---|
| `frontend/.../components/site-header/site-header.component.html` | El botón `fa-user-tie` ahora apunta a **`/employee`** (antes `/login`) | Pedido del usuario. El `employeeGuard` resuelve los dos casos: **sin sesión de empleado** → lo manda a `/login` y, al entrar, el login lo lleva a `/employee` (mismo flujo que antes); **con sesión de empleado** → entra directo a la home de empleados, sin volver a pasar por el login |
| `frontend/.../components/site-header/site-header.component.spec.ts` | La prueba verifica `href="/employee"` | Acompaña el cambio |

**Verificación:** `ng build` sin errores; `ng test` → 48 pruebas. Navegador real con un empleado de prueba (borrado al terminar): botón sin sesión → `/login` → login → `/employee`; desde el catálogo, con la sesión iniciada, el botón → `/employee` ("Welcome, Ana Test").

---


## 2026-11-06 — Nueva base de datos `carweb` (esquema, datos de prueba, pruebas y consultas)

**Ubicación:** `CarWebCode/sql/` → `schema.sql`, `seed.sql`, `checks.sql`, `queries.sql` (nuevos). **No** se modificaron `CarWeb.sql` ni `seed_cars.sql`, porque el backend actual depende de ellos.

### Contexto del diseño

Los **clientes no tienen cuenta**: su nombre, teléfono y correo se guardan solo en la cita (`appointments`). Solo empleados y gerentes tienen usuario. Las pruebas de manejo y las operaciones se ligan a la cita de la que salieron, y de ahí se obtienen los datos del cliente. Todo el SQL está en inglés (regla del proyecto).

### `schema.sql` — 13 tablas

`employees`, `managers`, `cars`, `spare_parts`, `stock_movements`, `appointments`, `test_drives`, `inspections`, `trades`, `documents`, `contracts`, `receipts`, `price_breakdowns`. Se crean en orden de dependencia.

| Regla | Cómo se implementó |
|---|---|
| InnoDB, `utf8mb4`, `utf8mb4_0900_ai_ci` en la base y en cada tabla | `CREATE DATABASE … COLLATE utf8mb4_0900_ai_ci` y `ENGINE/CHARSET/COLLATE` en cada `CREATE TABLE`. La búsqueda por marca y modelo ignora mayúsculas y acentos |
| PK `INT UNSIGNED AUTO_INCREMENT` (excepto `contracts` y `receipts`, que usan su número) | Sí |
| `created_at` / `updated_at` en todas las tablas | Sí |
| Dinero `DECIMAL(12,2)`, teléfonos `VARCHAR(15)`, fechas `DATETIME`, fotos `JSON` | Sí |
| Nombres de restricciones | `pk_`, `fk_<tabla>_<referencia>`, `uq_`, `chk_` (únicos en toda la base), `idx_` |
| Llaves foráneas | **20**, todas `ON DELETE RESTRICT ON UPDATE RESTRICT`, salvo `fk_documents_trade` (`ON DELETE CASCADE`). Esto evita el error 3823: MySQL no permite CASCADE / SET NULL en columnas usadas por un CHECK o por una columna generada `STORED` |
| Índice por cada llave foránea | Cada FK tiene su índice. Cuando la FK ya es la primera columna de un `UNIQUE` o de un índice compuesto, ese índice la cubre: `test_drives.appointment_id`, `test_drives.car_id`, `documents.trade_id`, `contracts` / `receipts` / `price_breakdowns.trade_id` |
| **16 CHECK**: año 1990–2100; precios > 0 si existen (`cars`, `trades`, `spare_parts`, `receipts`, `price_breakdowns`); exactamente un artículo (`stock_movements`, `trades`); refacción solo `Purchase`; horario y horas reales de la prueba de manejo; reserva de máximo 72 h | Valores fijos, sin `NOW()` (MySQL no permite funciones no deterministas en un CHECK) |
| Una sola operación activa por auto | Columna generada `active_car_id = IF(is_active, car_id, NULL) STORED` con `UNIQUE`. MySQL no tiene índices parciales, y un `UNIQUE` acepta varios `NULL` |
| `stock_movements` no se edita ni se borra | **2 triggers** (`BEFORE UPDATE` / `BEFORE DELETE`) con `SIGNAL SQLSTATE '45000'`. Un CHECK o una FK no pueden impedir UPDATE/DELETE. El cuerpo es de una sola instrucción, así que no necesita `DELIMITER` y funciona con *Execute All* |
| Cita: el mismo correo no puede tener dos citas a la misma hora | `uq_appointments_client_email_datetime` |
| Enlace para modificar/cancelar sin cuenta | `manage_token_hash CHAR(64) UNIQUE`: hash SHA-256 del token. El token original nunca se guarda |

**Agregados que la especificación no pedía de forma literal** (sin tablas ni columnas nuevas): `chk_trades_reserved_until` (la reserva vence a máximo 72 h de `trade_date`), los 2 triggers de `stock_movements` e `idx_spare_parts_brand_model` (filtrar refacciones por marca y modelo compatibles).

**Sin `IF NOT EXISTS` en las tablas, a propósito:** si una tabla ya existe con otra estructura, el script **falla con un error claro** en vez de saltarla en silencio y dejar un esquema mezclado.

### `seed.sql`

1 gerente, 2 empleados (hashes bcrypt reales de la contraseña de desarrollo **`DevPassword123!`**), 8 autos en estados distintos (Available ×3, Reserved, Sold, In test drive, Pending evaluation, Spare parts), 3 refacciones (2 sacadas del auto 8), 3 movimientos de inventario, 5 citas de 3 clientes (Laura 2, Carlos 2, Sofía 1), 1 prueba de manejo, 2 inspecciones y 2 operaciones completas (una compra y una venta) con 7 documentos, 2 contratos, 2 recibos y 2 desgloses.

**Coherencia:** el auto vendido está `Sold` / `Out of stock` y tiene su movimiento `Out/Sale`; el comprado está `Pending evaluation`, con su inspección y su movimiento `In/Purchase`; el recibo = precio final = desglose (convención: `final = base + ajustes + cargos − descuentos`, verificada); `manage_token_hash = SHA2('…', 256)` (64 hex); fotos en JSON válido. Nombres de personas ficticios.

### `checks.sql`

Cada prueba es un bloque que se ejecuta con **Ctrl + Enter**, con el error esperado en un comentario. Empieza con `SET SQL_SAFE_UPDATES = 0;`.

| # | Prueba | Error obtenido (verificado) |
|---|---|---|
| 1 | VIN repetido | 1062 `Duplicate entry '3TMCZ5AN1LM000001' for key 'cars.uq_cars_vin'` |
| 2 | Segunda operación activa para el mismo auto (con su preparación y limpieza) | 1062 `… for key 'trades.uq_trades_active_car_id'` |
| 3 | Movimiento con auto y refacción | 3819 `Check constraint 'chk_stock_movements_one_item' is violated.` |
| 4 | Dos citas, mismo correo y hora | 1062 `… for key 'appointments.uq_appointments_client_email_datetime'` |
| 5 | Segunda prueba de manejo de la misma cita | 1062 `… for key 'test_drives.uq_test_drives_appointment_id'` |
| 6 | Precio negativo | 3819 `Check constraint 'chk_cars_sale_price' is violated.` |
| 7 | Borrar una cita con operaciones | 1451 `… CONSTRAINT fk_trades_appointment …` |
| 8–12 (extra) | Refacción como `Sale`; año 1985; prueba de manejo que termina antes de empezar; editar/borrar un movimiento; borrar una operación con contrato | 3819 `chk_trades_spare_part_purchase`, 3819 `chk_cars_year`, 3819 `chk_test_drives_schedule`, 1644 (mensajes de los triggers), 1451 `fk_contracts_trade` |

### `queries.sql`

Para cada operación: el nombre, teléfono y correo del cliente, tomados de su cita (`trades JOIN appointments`), más el auto, el empleado responsable y el gerente que aprobó.

### Relaciones

| Relación | Cardinalidad | Columna que la implementa |
|---|---|---|
| Car **has** SpareParts | 1 : N (opcional) | `spare_parts.car_id` (NULL) |
| Car **moves in** StockMovements | 1 : N | `stock_movements.car_id` (NULL; uno de los dos) |
| SparePart **moves in** StockMovements | 1 : N | `stock_movements.spare_part_id` (NULL; uno de los dos) |
| Manager **records** StockMovements | 1 : N | `stock_movements.manager_id` |
| Employee **is assigned to** Appointments | 1 : N (opcional) | `appointments.employee_id` (NULL) |
| Employee **decides** Appointments | 1 : N (opcional) | `appointments.decision_by` (NULL) |
| Car **is the subject of** Appointments | 1 : N (opcional) | `appointments.car_id` (NULL) |
| Appointment **leads to** TestDrive | 1 : 0..1 | `test_drives.appointment_id` (UNIQUE) |
| Employee **accompanies** TestDrives | 1 : N | `test_drives.employee_id` |
| Car **is driven in** TestDrives | 1 : N | `test_drives.car_id` |
| Car **is inspected in** Inspections | 1 : N | `inspections.car_id` |
| Appointment **starts** Trades | 1 : N | `trades.appointment_id` |
| Employee **is responsible for** Trades | 1 : N | `trades.employee_id` |
| Manager **approves or rejects** Trades | 1 : N (opcional) | `trades.manager_id` (NULL) |
| Car **is traded in** Trades | 1 : N, **una activa** | `trades.car_id` + `uq_trades_active_car_id` |
| SparePart **is sold in** Trades | 1 : N | `trades.spare_part_id` |
| Trade **requires** Documents | 1 : N (uno por tipo) | `documents.trade_id` (CASCADE) + `uq_documents_trade_id_document_type` |
| Trade **is covered by** Contract | 1 : 0..1 | `contracts.trade_id` (UNIQUE) |
| Trade **produces** Receipt | 1 : 0..1 | `receipts.trade_id` (UNIQUE) |
| Trade **has** PriceBreakdown | 1 : 0..1 | `price_breakdowns.trade_id` (UNIQUE) |

### Reglas que MySQL no puede imponer con restricciones (y alternativa)

| Regla | Por qué no | Alternativa |
|---|---|---|
| La reserva vence 72 h después de **ahora** | Un CHECK no puede usar `NOW()` | `chk_trades_reserved_until` la limita respecto a `trade_date`. Liberar reservas vencidas lo hace la aplicación o un `EVENT` programado |
| No se pueden encimar dos pruebas de manejo del mismo auto | MySQL no tiene restricciones de exclusión por rango | Índice `(car_id, schedule_start)` para que la consulta de choque sea rápida. Se valida en el backend (o en un trigger) |
| `test_drives` solo de citas tipo "Test drive"; `trades` solo de citas "Purchase" / "Sale evaluation" | Un CHECK no puede leer otra tabla | Validación en el backend (o un trigger `BEFORE INSERT`) |
| Coherencia entre el estado del auto y sus operaciones/movimientos (p. ej. `Sold` → `Out of stock`) | Involucra varias tablas | La aplicación actualiza todo en una transacción |

### Verificación

- En una **base temporal** (creada y borrada en la prueba; la base real `CarWeb` **no se tocó**), con MySQL 8.0.46: `schema.sql` y `seed.sql` cargan completos, tanto con `mysql2` como con el cliente `mysql` de línea de comandos (que separa por `;` igual que Workbench). Resultado: 13 tablas, todas con `utf8mb4_0900_ai_ci`; 20 FK (1 CASCADE); 16 CHECK; 2 triggers; las cantidades del seed coinciden; 6/6 JSON válidos; 2/2 desgloses cuadran.
- `checks.sql`: las 7 pruebas obligatorias y las 6 extra dan exactamente el error documentado. Las de preparación y limpieza pasan.
- `queries.sql`: devuelve las 2 operaciones con los datos del cliente de su cita.

### ⚠️ Antes de usarla

1. **Choca con la base actual.** En Windows, MySQL no distingue mayúsculas (`lower_case_table_names = 1`): `carweb` **es** la base `CarWeb` que ya existe, y ya tiene tablas `cars` y `trades` con la estructura vieja. `schema.sql` fallará en `cars` (después de crear `employees` y `managers`). Hay que borrar las tablas viejas o la base completa (respaldarla primero) y luego ejecutar `schema.sql` y `seed.sql`.
2. **El backend y el frontend actuales usan el esquema viejo:**
   - El catálogo lee `Cars` / `CarPhotos` con columnas en PascalCase; ahora es `cars` en snake_case, con las fotos en JSON.
   - El registro y el login usan la tabla `User`. En este diseño **los clientes no tienen cuenta**, así que el registro de clientes ya no aplica, y el login debe leer `employees` y `managers`.
   - Hay que migrar el código antes de cambiar de base.

---

## 2026-11-06 — Cambio a la base nueva, reservas de 72 h y pruebas de manejo encimadas

### 1. Base vieja eliminada y base nueva cargada

- El usuario confirmó que tenía **respaldo** de la base vieja.
- Contenido antes de borrarla: `carphotos(81)`, `cars(28)`, `user(1)` y tablas vacías (`document`, `receipt`, `spareparts`, `stockmovement`, `trades`).
- Se ejecutó `DROP DATABASE carweb`. En Windows es la misma base que `CarWeb`, porque `lower_case_table_names = 1`.
- Se cargaron `sql/schema.sql` y `sql/seed.sql`. Resultado: las 13 tablas nuevas con sus datos de prueba.
- `event_scheduler` está en `ON` en este MySQL. No se usa, ver el punto 2.

### 2. Liberación de reservas de 72 horas (alternativa a "un CHECK no puede usar `NOW()`")

| Archivo | Qué hace |
|---|---|
| `backend/src/repositories/trade.repository.ts` (nuevo) | `releaseExpiredReservations()`, en **una transacción**: selecciona con `FOR UPDATE` las operaciones activas en estado **`In progress`** con `reserved_until < NOW()`; las marca `Cancelled` e inactivas (`is_active = FALSE`, con lo que `active_car_id` queda en NULL y el auto puede tener otra operación); regresa a `Available` el auto o la refacción si estaban `Reserved`. Devuelve los ids liberados |
| `backend/src/jobs/reservationExpiry.job.ts` (nuevo) | `startReservationExpiryJob(repo, intervalMs = 5 min)`: corre **al arrancar y luego cada 5 minutos**; nunca encima dos ejecuciones; si la base falla, lo registra y sigue; el temporizador usa `unref()` (no mantiene vivo el proceso); devuelve una función para detenerlo |
| `backend/src/app.ts` | Arranca el job después de levantar el servidor |

**Por qué en el backend y no como `EVENT` de MySQL:** el usuario pidió programarlo "en el back". Así no depende de la configuración `event_scheduler` del servidor de cada integrante, y la lógica queda en el código con pruebas.

**Por qué solo `In progress`:** una operación en `Pending approval` ya está esperando la decisión del gerente, y cancelarla sola rompería ese flujo. Se usa `NOW()` de la base, el mismo reloj con el que se calcula `reserved_until`.

### 3. Pruebas de manejo encimadas (alternativa a "MySQL no tiene restricciones de exclusión")

Endpoint nuevo **`POST /api/v1/test-drives`**, con cuerpo `{ appointmentId, employeeId, carId, scheduleStart, scheduleEnd }`. Sigue la arquitectura en capas:

| Archivo | Qué hace |
|---|---|
| `validators/testDrive.ts` | Ids enteros positivos; fechas `YYYY-MM-DD HH:mm` (o con `T`, segundos opcionales), rechaza fechas imposibles (30 de febrero); normaliza a `YYYY-MM-DD HH:mm:ss`; `scheduleEnd > scheduleStart`. Las fechas viajan como texto, **nunca** como `Date` de JS, para que no haya corrimientos de zona horaria con `DATETIME` |
| `repositories/testDrive.repository.ts` | `scheduleIfFree()`, en **una transacción**: **bloquea la fila del auto** (`SELECT … FOR UPDATE`), así dos solicitudes simultáneas para el mismo auto se atienden una tras otra; verifica que existan el auto, el empleado y la cita; que la cita sea tipo **"Test drive"** (otra de las alternativas propuestas); que la cita no tenga ya una prueba; y busca un **choque**: `schedule_start < fin_nuevo AND schedule_end > inicio_nuevo` (usa `idx_test_drives_car_id_schedule_start`). Si todo está bien, inserta |
| `services/testDrive.service.ts` | Traduce el resultado: 404 (auto, empleado o cita no existen) o **409** (cita que no es de prueba de manejo, cita que ya tiene prueba, o **"The car already has a test drive from … to …"**) |
| `controllers/testDrive.controller.ts`, `routes/testDrive.routes.ts`, `routes/index.ts` | Ruta montada en `/test-drives`; responde **201** con la prueba creada |
| `dtos/testDrives/TestDriveDto.ts` | Forma del cuerpo y de la respuesta |
| `errors/HttpError.ts` | Nuevo `ConflictError` (409) |

**Regla de choque:** dos horarios del **mismo auto** chocan si cada uno empieza antes de que termine el otro. Una prueba que empieza **justo** cuando termina otra sí se permite. Autos distintos nunca chocan.

### 4. Catálogo y login pasados al esquema nuevo

Al borrar la base vieja, estos dos dejaban de funcionar:

| Archivo | Cambio |
|---|---|
| `repositories/carFilters.ts` | Columnas en snake_case (`status`, `inventory_status = 'In stock'`, `brand`, `model`). El catálogo exige además `sale_price IS NOT NULL`, porque ahora el precio puede ser nulo y no se puede mostrar un auto sin precio |
| `repositories/car.repository.ts` | Lee `cars` (snake_case). La foto principal es el primer elemento de `cars.photos` (`JSON_EXTRACT(photos, '$[0]')`); el detalle convierte la lista JSON en `[{ id, url, isMain }]`. Orden: más nuevos primero (`created_at`) |
| `dtos/cars/CarDto.ts` | `price` y `tireCondition` ahora aceptan `null` |
| `constants/carStatus.ts` | Los 7 valores del `ENUM` nuevo |
| `controllers/userController.ts` → `loginUser` | Busca en **`employees`** y luego en **`managers`** (`UNION ALL`). El rol (`employee` / `manager`) sale de la tabla. La respuesta mantiene el mismo formato, así que el frontend no cambia |

### 5. Otros

- `README.md`: requisito **MySQL 8.0.16+** (XAMPP/MariaDB ya no sirve por `utf8mb4_0900_ai_ci`); pasos con `schema.sql` y `seed.sql` (el primero ya crea la base); aviso de borrar la base vieja; `DB_NAME=carweb`; contraseña de desarrollo de los usuarios del seed.
- `.env.example`: no se tocó (el equipo dejó los valores vacíos).

### Verificación

- Backend: `tsc` sin errores; `npm test` → **6 archivos, 47 pruebas** (26 nuevas):
  - `reservationExpiry.job.test.ts`: corre al iniciar y en cada intervalo; registra lo liberado; sigue después de un error de la base; no encima ejecuciones; se detiene.
  - `testDrives.test.ts`: crea y normaliza fechas; permite empezar justo al terminar otra; rechaza 4 tipos de choque con 409; mismo horario en otro auto sí se permite; 6 casos de 400; y los 404/409 de cada falla.
  - `carFilters.test.ts` actualizado; `app.test.ts` (del equipo) con un mock del job y la verificación de que arranca.
- **Contra MySQL real**, con datos temporales (correo `claude-check@example.com`), limpiados al terminar:
  - **Job:** una operación con la reserva vencida hace 2 días sobre el auto 4 → al arrancar el backend: `[reservations] released 1 expired reservation(s): trades 3`, la operación quedó `Cancelled` / inactiva y el auto 4 `Available`.
  - **Pruebas de manejo:** choque con la existente → 409; empezar justo al terminar → 201; la misma cita otra vez → 409; cita tipo Viewing → 409; auto inexistente → 404; **dos solicitudes simultáneas** para el mismo auto y horario → una 201 y otra 409 (el bloqueo funciona).
  - **Catálogo:** solo autos disponibles con foto principal; "MÁZDA" → Mazda CX-5; el detalle del auto 7 devuelve `price: null`, `isAvailable: false`.
  - **Login:** `ana.torres@carweb.test` → employee; `MARIA.LOPEZ@carweb.test` (mayúsculas) → manager; contraseña mala o correo inexistente → 401 genérico.

### Pendiente (siguiente paso: frontend y lo que quedó con el esquema viejo)

- **Registro de clientes:** `POST /users/register` y la página `/register` usan la tabla `User`, que ya no existe (responde 500). En el diseño nuevo **los clientes no tienen cuenta**, así que hay que quitarlos o cambiarlos por "agendar cita".
- **CRUD de inventario del equipo** (`Cars.Controller.ts`, `/cars/getAllCars`, etc.) usa columnas viejas (`InventoryStatus = 1`, PascalCase): ya no funciona.
- **Frontend:** mostrar "precio no disponible" cuando `price` es `null`, y `tireCondition` nulo; crear la pantalla de pruebas de manejo para empleados que use `POST /test-drives`.
- **Protección:** `POST /test-drives` es para empleados, pero el backend todavía no tiene sesión ni token, así que hoy cualquiera puede llamarlo.
- **Archivos viejos:** `sql/CarWeb.sql`, `sql/seed_cars.sql`, `sql/borrarDemo.sql` y la colección de Postman del equipo (`Register User`) quedaron obsoletos. Conviene borrarlos para que nadie los vuelva a ejecutar.

---

## 2026-11-06 — Se borran los archivos del esquema viejo

Con la confirmación del usuario se eliminaron los archivos que solo servían para la base vieja, para que nadie los vuelva a ejecutar:

| Archivo | Por qué ya no sirve |
|---|---|
| `CarWebCode/sql/CarWeb.sql` | Esquema viejo (`Cars`, `User`, `CarPhotos`…). Lo reemplaza `sql/schema.sql`. En Windows, ejecutarlo recrearía tablas que chocan con las nuevas |
| `CarWebCode/sql/seed_cars.sql` | Datos de prueba del esquema viejo. Lo reemplaza `sql/seed.sql` |
| `CarWebCode/sql/borrarDemo.sql` (del equipo) | Borraba las tablas viejas |
| `backend/postman/collections/CarWeb API/Users/Register User.request.yaml` (del equipo) | Petición a `POST /users/register`, que usa la tabla `User`, que ya no existe (en el diseño nuevo los clientes no tienen cuenta) |
| Variables `userName`, `userEmail`, `userPassword` y `userPhone` de `backend/postman/environments/CarWeb Local.environment.yaml` | Solo las usaba esa petición. Se dejó `baseUrl` y la colección `CarWeb API`, para las peticiones nuevas |

Antes de borrar se verificó que ningún otro archivo los usara (solo esta bitácora los menciona, como historial). En `CarWebCode/sql/` quedan: `schema.sql`, `seed.sql`, `checks.sql` y `queries.sql`.

---

## 2026-11-06 — Frontend con el esquema nuevo: sin registro de clientes, precio nulo y pantalla de pruebas de manejo

### 1. Se quitó el registro de clientes

En el diseño nuevo **los clientes no tienen cuenta**: solo agendan citas. Solo el personal (empleados y gerentes) inicia sesión.

| Archivo | Cambio |
|---|---|
| `frontend/src/app/pages/register/` | **Eliminada** (componente, plantilla y pruebas) |
| `app.routes.ts` | Sin la ruta `/register`. Si alguien entra a esa URL, la ruta comodín lo manda al inicio |
| `services/user.service.ts`, `models/user.model.ts` | Sin `register()`, `RegisterUserRequest` ni `RegisterUserResponse` |
| `pages/login/login.component.html` | Subtítulo **"Staff access"**. El enlace "Don't have an account? Sign up" se cambió por **"← Back to CarWeb"** |
| `components/quick-access-sidebar` | *Log in* / *Sign up* → **Employee access** (`/employee`). *My appointments* → **Schedule an appointment** (Soon): sin cuenta, el cliente maneja su cita con el enlace del correo |
| `backend/src/controllers/userController.ts`, `routes/userRoutes.ts` | Se eliminó `registerUser` y `POST /users/register` (usaban la tabla `User`, que ya no existe) |

### 2. Precio y estado de llantas sin dato

`cars.sale_price` y `cars.tire_condition` pueden ser `NULL` en el esquema nuevo:

- `models/car.model.ts`: `price: number | null`, `tireCondition: string | null`.
- `pages/car-detail`: muestra **"Price not available"** (en gris) si no hay precio, y **"—"** si no hay estado de llantas.
- El catálogo no cambia: el backend solo lista autos con precio.

### 3. Pantalla de pruebas de manejo para empleados (`/employee/test-drives`)

**Backend (consultas para alimentar la pantalla):**

| Endpoint | Devuelve |
|---|---|
| `GET /api/v1/test-drives/pending-appointments` | Citas tipo **"Test drive"** en `Pending` o `Confirmed`, de **hoy en adelante**, que **todavía no** tienen prueba programada. Incluye cliente, fecha y auto (`Brand Model Year`) |
| `GET /api/v1/test-drives` | Pruebas de manejo que **no han terminado** (`schedule_end >= NOW()`), con auto, cliente y empleado, ordenadas por inicio |

Están en `repositories/testDrive.repository.ts`, `services/testDrive.service.ts`, `controllers/testDrive.controller.ts`, `routes/testDrive.routes.ts`, con sus DTOs en `dtos/testDrives/TestDriveDto.ts`.

**Frontend:**

| Archivo | Qué hace |
|---|---|
| `components/employee-header/` (nuevo) | El encabezado del portal de empleados (logo, "Employee portal", nombre, Log out) se sacó de la home de empleados para **reutilizarlo** |
| `pages/employee-home/` | Usa `<app-employee-header>`. La tarjeta **Test drives** ahora es un enlace ("Open →"); las demás siguen "Coming soon" |
| `pages/employee-test-drives/` (nuevo) | **Programar:** se elige una cita pendiente de la lista (fecha · cliente · auto); el auto se toma de la cita; el horario se **sugiere** (hora de la cita + **45 min**) y se puede editar; el empleado que acompaña es el que inició sesión; al guardar se recargan las dos listas. **Errores:** muestra el mensaje del backend, por ejemplo el choque *"The car already has a test drive from … to …"*. Si la cita no tiene auto, avisa y no deja programarla. **Gerentes:** ven las listas pero no el formulario, porque la base exige que quien acompaña sea un **empleado** (`test_drives.employee_id`). **Próximas pruebas:** tabla con cuándo, auto, cliente y empleado |
| `services/test-drive.service.ts`, `models/test-drive.model.ts` (nuevos) | Llamadas y tipos de los 3 endpoints |
| `app.routes.ts` / `app.routes.server.ts` | Ruta `employee/test-drives` con `employeeGuard`, renderizada en el navegador |

### Verificación

- Backend: `tsc` sin errores; `npm test` → **49 pruebas** (+2: los dos `GET`).
- Frontend: `ng build` sin errores; `ng test` → **12 archivos, 54 pruebas**. Nuevas o actualizadas:
  - pantalla de pruebas de manejo: 6 casos, más 3 de `addMinutes` (incluye cambio de día y de año);
  - "Price not available" en el detalle;
  - enlace de la tarjeta Test drives;
  - enlaces del menú ☰.
  - Se eliminaron las 4 pruebas del registro.
- **Navegador real contra MySQL**, con 2 citas temporales para el auto 2 a las 17:00 y 17:15 (borradas al terminar):
  1. El login ya no tiene "Sign up"; `/register` → `/`.
  2. Login de Ana → `/employee` → tarjeta **Test drives** → `/employee/test-drives`.
  3. Las dos citas aparecen en la lista. Al elegir la de las 17:00 se sugiere 17:00 → 17:45.
  4. Programarla → *"Test drive scheduled for Pedro Ruiz."*, y aparece en "Upcoming test drives".
  5. Programar la de las 17:15 (se encima) → *"The car already has a test drive from 2026-11-20 17:00:00 to 2026-11-20 17:45:00"*.
  6. Detalle del auto 7 → *"Price not available"*.

### Pendiente

- **CRUD de inventario del equipo** (`Cars.Controller.ts`, `/cars/getAllCars`, etc.): sigue con las columnas viejas y no funciona con la base nueva.
- **Protección del backend:** los endpoints de empleados (`/test-drives`) no exigen sesión ni token todavía.
- **Seed:** no trae citas de prueba de manejo pendientes (la especificación fija 5 citas), así que la lista de la pantalla aparece vacía hasta que se registre una. Por ahora se crean con un `INSERT INTO appointments … appointment_type = 'Test drive'`.

---

## 2026-11-06 — `employees` y `managers` unificadas en `staff`

### Decisión (del usuario)

Una sola tabla para el personal, y **el gerente puede hacer todas las tareas del empleado además de las suyas** (aprobar o rechazar operaciones y registrar movimientos de inventario).

**Por qué:** las dos tablas tenían exactamente las mismas columnas. El rendimiento no era el problema: el login hacía un `UNION ALL` de dos búsquedas indexadas, una diferencia despreciable. Las ventajas son de integridad y mantenimiento:
- El **correo es único en todo el personal**: antes el mismo correo podía estar en las dos tablas.
- **Ascender** a un empleado es un `UPDATE` del rol, no copiar la fila y cambiarle el id.
- Login y bloqueo se programan **una sola vez**.
- El gerente puede atender citas y acompañar pruebas de manejo.

### `sql/schema.sql`

| Cambio | Detalle |
|---|---|
| `employees` + `managers` → **`staff`** | Mismas columnas más `role ENUM('Employee','Manager') NOT NULL DEFAULT 'Employee'`. `uq_staff_email` (correo único en todo el personal). `uq_staff_staff_id_role (staff_id, role)` como destino de las llaves compuestas |
| **Tareas de empleado** (cualquier miembro del personal) | `appointments.employee_id`, `appointments.decision_by`, `test_drives.employee_id` y `trades.employee_id` → FK simple a `staff(staff_id)`. Conservan su nombre de columna |
| **Tareas solo de gerente** (la base lo garantiza) | `trades.manager_id` y `stock_movements.manager_id` → **FK compuesta** `(manager_id, manager_role) → staff(staff_id, role)`. Se agregó la columna `manager_role` (mismo `ENUM`, `DEFAULT 'Manager'`) con un CHECK `manager_role = 'Manager'` (`chk_trades_manager_role`, `chk_stock_movements_manager_role`). Así la fila referenciada **tiene** que ser un gerente. En `trades`, mientras `manager_id` es NULL (sin decisión) la llave no se revisa |
| Índices | `idx_trades_manager_id_role` e `idx_stock_movements_manager_id_role` (compuestos, los exige la FK) |
| Totales | **12 tablas** (antes 13), 20 FK, **18 CHECK** (antes 16) |

**Por qué una llave compuesta y no un CHECK:** un CHECK no puede leer el rol en otra tabla. Con la llave compuesta la regla queda en la base: aunque alguien inserte datos a mano, no puede poner a un empleado como aprobador.

### `sql/seed.sql`, `checks.sql`, `queries.sql`

- **seed:** `staff` = 1 Maria Lopez (**Manager**), 2 Ana Torres (Employee), 3 Luis Medina (Employee). Se reasignaron las referencias (Ana 1→2, Luis 2→3); los datos de la historia no cambian.
- **checks:** los ids de los bloques existentes se ajustaron, y se agregaron 4 pruebas (todas verificadas):

| # | Prueba | Resultado |
|---|---|---|
| 13 | Un empleado como aprobador (`UPDATE trades SET manager_id = 2`) | 1452 `… CONSTRAINT fk_trades_manager FOREIGN KEY (manager_id, manager_role) REFERENCES staff (staff_id, role)` |
| 14 | Movimiento registrado por un empleado | 1452 `… fk_stock_movements_manager …` |
| 15 | Mismo correo para dos miembros del personal | 1062 `… for key 'staff.uq_staff_email'` |
| 16 | **Un gerente acompaña una prueba de manejo** | Pasa, con su limpieza |

- **queries:** `JOIN staff` para el empleado y para el gerente que aprobó.

### Backend

| Archivo | Cambio |
|---|---|
| `controllers/userController.ts` → `loginUser` | Una sola consulta a `staff`. La API sigue mandando `role` en minúsculas (`'employee'` / `'manager'`), así que el frontend no cambia |
| `repositories/testDrive.repository.ts` | Quien acompaña puede ser cualquier miembro de `staff`; la lista de próximas pruebas hace `JOIN staff` |
| `services/testDrive.service.ts` | `"employee-not-found"` → `"staff-not-found"`, con mensaje 404 `"Staff member not found"` |
| `tests/testDrives.test.ts` | Mensaje actualizado |

### Frontend

`pages/employee-test-drives`: se quitó la restricción para gerentes. Ahora **también pueden programar pruebas de manejo**. La prueba "manager sin formulario" se cambió por "un gerente programa y se envía su id".

### Base de datos local

Se **recargó** `carweb` con el esquema y el seed nuevos. Antes de borrarla se verificó que solo tuviera los datos del seed (5 citas, 2 operaciones, 1 prueba de manejo).

### Verificación

- Base temporal: `schema.sql` y `seed.sql` cargan; los 16 bloques de `checks.sql` dan el resultado documentado; `queries.sql` devuelve "aprobó Maria Lopez".
- Backend: `tsc` sin errores; `npm test` → 49 pruebas. Frontend: `ng build` sin errores; `ng test` → 54 pruebas.
- Contra MySQL real: login de Maria → `role: manager`, de Ana y de `LUIS.MEDINA@…` (mayúsculas) → `role: employee`. La **gerente (id 1) programó una prueba de manejo** → 201, y aparece en "próximas" acompañada por Maria Lopez. `employeeId: 99` → 404 "Staff member not found". Los datos temporales se borraron.

### Relaciones (actualizadas)

| Relación | Cardinalidad | Columna |
|---|---|---|
| Staff (Manager) **records** StockMovements | 1 : N | `stock_movements.manager_id` (+ `manager_role`) |
| Staff **is assigned to** / **decides** Appointments | 1 : N (opcional) | `appointments.employee_id` / `decision_by` |
| Staff **accompanies** TestDrives | 1 : N | `test_drives.employee_id` |
| Staff **is responsible for** Trades | 1 : N | `trades.employee_id` |
| Staff (Manager) **approves or rejects** Trades | 1 : N (opcional) | `trades.manager_id` (+ `manager_role`) |

Las demás relaciones no cambian (ver la entrada "Nueva base de datos `carweb`").

### Pendiente

- **Diagrama entidad-relación** (`Documentation/Entity-relationship_model/CarWebER.png`): está desactualizado. Tiene `Employee` y `Client` con contraseña; ahora son `Staff` (con rol) y los datos del cliente viven en `Appointment`.

---

**Corrección en README.md:** "crea la base y las 13 tablas" → "las 12 tablas".

---

## 2026-11-09 — Prompt para el diagrama ER (Dia) y el diccionario de datos (Word)

**Ubicación:** `Documentation/Prompt_ER_y_Diccionario.md`

### Qué se hizo

Se escribió un prompt listo para pegar en un asistente de IA (junto con `CarWebCode/sql/schema.sql`) que genera:

1. `CarWebER.dia`: diagrama entidad-relación en notación Chen con la hoja "ER" de Dia (entidades, atributos, rombos y cardinalidades).
2. `CarWeb_Diccionario_de_Datos.docx`: diccionario de datos con una sección por tabla (campos, tipos, nulos, llaves, valores por defecto, ENUM/CHECK, descripción), sus restricciones, el resumen de relaciones y las reglas de negocio.

### Para qué sirve

Para reemplazar el diagrama `Entity-relationship_model/CarWebER.png`, que está desactualizado (pendiente de la entrada anterior), y tener el diccionario de datos que pide la documentación del proyecto.

### Por qué así

- El prompt ya trae las **20 llaves foráneas** con su verbo y cardinalidad (las mismas de esta bitácora), para que la IA no tenga que deducirlas y no invente relaciones.
- Se pide `.dia` en XML sin comprimir porque Dia lo abre sin problema y una IA lo puede escribir como texto.
- Se omiten `created_at`/`updated_at` en el diagrama (están en todas las tablas y lo saturan), pero sí van en el diccionario.
- Nombres técnicos en inglés (como en el código) y descripciones en español (como el resto de la documentación).

---

## 2026-11-20 — Resolución del merge con la rama de repuestos (spare parts)

**Ubicación:** `CarWebCode/frontend/src/app/` (`app.routes.ts`, `app.routes.server.ts`, `pages/employee-home/`)

### Qué se hizo

Al fusionar el commit `31451eb` ("almost everything related to spareParts") quedaron 5 archivos en conflicto. Se habían quitado los marcadores, pero las dos versiones quedaron mezcladas:

- **`app.routes.ts` y `app.routes.server.ts`:** la ruta `employee/test-drives` y la nueva ruta `manager` quedaron fusionadas en un solo objeto (dos `path`), así que se perdía una de las dos. Se separaron en dos rutas.
- **`app.routes.ts`:** se quitó el `import { SparePartsComponent }` estático, que no se usaba (la ruta `spare-parts/register` ya lo carga con `loadComponent`) y metía el componente en el bundle inicial.
- **`employee-home.component.html`:** tenía dos plantillas de tarjeta encimadas (`<li>` sin cerrar). Se dejó la de HEAD (`.task--link` con "Open →"), que sirve para cualquier tarea con ruta: ahora **Test drives** y **Spare parts catalog**.
- **`employee-home.component.css`:** se quitaron `.task__link` y `.task__action`, que solo usaba la plantilla descartada.
- **`employee-home.component.spec.ts`:** dos `it` encimados en uno. Se unificaron: 8 tareas, 6 "Coming soon" y 2 enlaces (`/employee/test-drives` y `/spare-parts`).

### Para qué sirve

Para que el frontend vuelva a compilar con las páginas de test drives, del gerente y de repuestos funcionando a la vez.

### Por qué así

- Se eligió la tarjeta de HEAD porque su texto ("Open") es genérico; la entrante decía "Browse catalog", que solo tiene sentido para el catálogo de repuestos.
- Verificado: `ng build` y `ng test` (69 tests) en el frontend, y `tsc` y `vitest` (54 tests) en el backend. El backend necesitaba `npm install` porque el merge agregó `jsonwebtoken`.

---

## 2026-11-24 — Frontend de las funciones que solo tenían backend (y reparación del backend después de los merges #33–#35)

**Ubicación:** `CarWebCode/backend/src/` y `CarWebCode/frontend/src/app/`

### 1. Reparación del backend (no compilaba)

| Problema | Arreglo |
|---|---|
| `Appointments.controller.ts`: `modifyAppointment` y `cancelAppointment` quedaron encimadas en el merge y se perdió el cuerpo de *cancel* | Se separaron. *Cancel* se reescribió para el esquema nuevo: el cliente se identifica con el **token del enlace** (no con `userId`), pide `confirm: true`, motivo opcional (≤255), notifica al empleado asignado y escribe en `appointment_logs` |
| `Appointments.routes.ts` se montaba **después** del `return` en `routes/index.ts` (nunca se ejecutaba) | Se monta antes del `return`, con `GET /:id/manage`, `PATCH /:id/modify` y `PATCH /:id/cancel` |
| `SaleOffers.routes.ts` no estaba montada | Montada en `/sale-offers`. `server.ts` acepta cuerpos de hasta 35 MB **solo** en esa ruta (3–5 fotos de 5 MB en base64) |
| `Cars.routes.ts` importaba `middlewares/validateDate.js`, que no existe | Se quitó el import |
| CRUD de inventario (`Cars.Controller.ts`) usaba el esquema viejo (`Cars`, `InventoryStatus = 1`) y no pedía sesión | Reescrito para `cars` (camelCase en la API), **solo gerentes** (`authenticateToken` + `requireManager`), validación en `validators/inventoryCar.ts` |
| `filterCars` no coincidía con su prueba | SQL dinámico, valores recortados y respuesta `{ cars }` |

### 2. Cambios de backend que necesitaba el frontend

- **`POST /appointments` devuelve `manageToken`** (una sola vez; en la base solo queda su SHA-256). No hay envío de correo, así que sin esto el cliente nunca podía modificar, cancelar ni ofrecer su auto. Cuando exista el correo, el enlace se manda por ahí.
- **Cita "Sale evaluation" sin auto:** el validador ahora acepta ese tipo y `carId` opcional solo para él (`POST /sale-offers` exige una cita de este tipo).
- **`GET /appointments/:id/manage`** (token en el header `X-Manage-Token`, para que no quede en los logs): devuelve la cita, `canModify`/`canCancel` y la oferta de venta ligada, si hay.
- **Al confirmar una cita, quien confirma queda como empleado responsable** (`employee_id`), si no había uno. Lo pide ApproveAppointments y hace falta para que las notificaciones de *modify*/*cancel* lleguen a alguien.
- **Inventario:** crear/editar pide confirmación (`confirmLowerSalePrice`) si el precio de venta es menor al de compra; VIN o placas repetidos → 409; no se puede borrar ni cambiar el estado de un auto con una operación activa (`trades.is_active`); borrar = `inventory_status = 'Out of stock'`.

### 3. Pantallas nuevas (frontend)

| Ruta | Quién | Qué hace |
|---|---|---|
| `/employee/appointments` | Empleados y gerentes | Lista de citas con filtro (Pending / Confirmed / All) y búsqueda. Confirmar, rechazar (motivo obligatorio), cancelar (motivo obligatorio) y reprogramar |
| `/employee/test-drives` | Empleados y gerentes | La página ya existía pero había perdido su ruta en un merge; se volvió a enlazar |
| `/manager/inventory` | Gerentes | Tabla del inventario con búsqueda, filtro por estado y "mostrar autos dados de baja". Agregar/editar auto, cambiar precio y dar de baja (con segundo clic) |
| `/appointments/:id/manage?token=…` | Cliente (sin cuenta) | Ver su cita, cambiar la fecha (no a menos de 2 h), cancelar (con casilla de confirmación), y si es *Sale evaluation*: enlace para ofrecer su auto o ver su solicitud y cambiar el precio pedido (máx. +10 %, una vez cada 24 h) |
| `/sell-my-car` | Cliente | 3 pasos: agendar la cita *Sale evaluation* → datos del auto y estimado ("Estimated – subject to inspection") → VIN, 3–5 fotos JPG/PNG ≤5 MB y aceptar el estimado |

- **Detalle del auto:** después de agendar se muestra el mensaje (antes se guardaba pero nunca se mostraba) y el enlace **"Manage your appointment"**.
- **Tarjetas de los portales:** *Appointments* y *Test drives* ya abren su página (empleado y gerente); el gerente tiene además *Car inventory*. El texto del botón ahora viene de un campo `action` en lugar de ternarios en la plantilla.
- **Estilos compartidos** en `styles.css` (`.ws-page`, `.ws-panel`, `.ws-form`, `.btn`, `.ws-table`, `.ws-pill`…) para que cada página no repita CSS y quede bajo el presupuesto de 4 kB.
- `utils/http-error.ts` (lee `{ message }` o `{ error }` del API) y `utils/datetime.ts` (conversión de fechas y horario de atención).

### 4. Cosas que el merge había revertido

- Volvió la página `/register`, que llamaba a `POST /users/register` (ya no existe). Se eliminó otra vez, con `register()` y sus tipos.
- El menú ☰ volvió a *Log in / Sign up*. Ahora: Home, Catalog, Spare parts, **Sell my car** y **Employee access**.
- El login vuelve a decir "Staff access" y "← Back to CarWeb".
- `employee/profile` y `manager/staff` se renderizan en el navegador (`app.routes.server.ts`): dependen de la sesión, que el servidor no ve.

### 5. Otros

- `.gitignore`: `backend/uploads/` (fotos de los clientes).
- `.env.example`: se agregó `JWT_SECRET` (sin él, el login responde 500).
- **Base local:** le faltaban `trade_logs`, `appointment_logs` y `notifications` (están en `schema.sql` desde los merges). Se crearon con sus `CREATE TABLE` de `schema.sql`, sin borrar nada. **Cada integrante debe hacer lo mismo** (o recrear la base), o *modify*, *cancel* y las ofertas de venta responden 500.

### Verificación

- Backend: `tsc` sin errores; `vitest` → **14 archivos, 131 pruebas** (antes 4 fallaban y `Appointments.test.ts` no cargaba). Nuevas: `inventory.test.ts`, `appointmentService.test.ts` y `Appointments.test.ts` reescrito (cancel con token, modify, manage).
- Frontend: `ng build` sin errores (sigue la advertencia previa de presupuesto en `staff-management.component.css`); `ng test` → **21 archivos, 90 pruebas**. Nuevas specs de las 4 páginas.
- **API real contra MySQL** (script de 23 pasos, borra lo que crea): login, inventario (401/403, crear, VIN repetido, editar, precio, baja), cita con token, enlace con token incorrecto → 404, confirmar (asigna a Ana Torres), reprogramar, modificar → Pending, cancelar (pide confirmación, luego 409), *Sale evaluation* sin auto, estimado de un Ford Escape 2020, oferta con 3 fotos, precio pedido (>10 % → 400, ok, otra vez → 409 por las 24 h).
- No se probó en el navegador real.

### Pendiente

- **Envío de correo** con el enlace de la cita; hoy solo se muestra en pantalla al agendar.
- **Bitácora de inventario** (fecha, gerente, auto, acción y campos cambiados): la historia la pide y no hay tabla para eso.
- **`/test-drives` sigue sin token** en el backend: cualquiera puede llamarlo.
- Las fotos de `uploads/cars` no se publican como estáticos; hoy no hace falta porque esos autos no salen en el catálogo.
- `validators/cars.validators.ts` (esquema viejo) ya no se usa.

---

## 2026-11-24 — Migración del CSS a Tailwind CSS v4 (primera parte)

### Qué se hizo

- **`styles.css`** ahora carga Tailwind v4 (`@tailwindcss/postcss`, configurado en `frontend/.postcssrc.json`), **sin Preflight**: solo `tailwindcss/theme.css` y `tailwindcss/utilities.css`.
- La paleta pasó de `:root` a **`@theme static`** con los mismos nombres (`--color-inferno`, `--color-ash-deep`, `--color-primary`, `--color-text-muted`…). Cada color genera utilidades (`bg-inferno-tint`, `text-text-muted`, `border-border-strong`…) y `var(--color-*)` sigue funcionando en el CSS que aún no se migra. Se agregaron `shadow-card` y `shadow-panel`.
- Estilos globales en capas: `body`, `a`, `.visually-hidden` y `font: inherit` para `button/input/select/textarea` en `@layer base`; las clases compartidas `.ws-*` y `.btn` en `@layer components`, para que una utilidad pueda sobrescribirlas (por ejemplo, `ws-page max-w-[760px]`).
- **Migrados a utilidades (se borró su `.css` y su `styleUrl`):**
  - Componentes: `card`, `button`, `search-bar`, `car-card`, `site-footer`, `employee-header`, `site-header`, `quick-access-sidebar` y `appointment-modal` (estaba vacío).
  - Páginas: `home`, `car-catalog`, `employee-appointments`, `manage-appointment`, `sell-my-car` y `manager-inventory`.
  - Los `:host { display:flex; flex-direction:column; min-height:100dvh }` ahora son `host: { class: 'flex min-h-dvh flex-col' }` en el `@Component`.
  - Los media queries del header (760 px y 480 px) ahora son variantes `max-[760px]:` y `max-[480px]:`.
  - El botón activo del header usa `aria-current="page"` (`ariaCurrentWhenActive`) y `aria-[current=page]:bg-inferno-tint` en lugar de la clase `site-header__btn--active`.

### Para qué sirve

Los estilos quedan junto al HTML, con la paleta de CarWeb como utilidades. Así no hay que inventar nombres de clase ni repetir CSS en cada componente, y el presupuesto de 4 kB por componente deja de ser un problema.

### Por qué así

- **Sin Preflight:** el reset de Tailwind quita márgenes, tamaños de títulos, viñetas y estilos de botones. Las páginas que aún usan CSS propio cuentan con esos valores del navegador, y activarlo ahora las rompería. Se activará cuando todo esté migrado; para eso basta con cambiar los dos `@import` por `@import 'tailwindcss';`.
- **`@theme static`:** sin `static`, Tailwind solo emite las variables que usa alguna utilidad, y el CSS que aún no se migra perdería colores.
- **Clases que usan las pruebas:** se conservaron como "ganchos" sin estilos (`employee-header__name`, `site-header__nav`, `site-header__btn--icon`, `sidebar`, `sidebar-toggle`, `sidebar__link`, `catalog__status`, `catalog__search`, `pagination`, `action-form`, `price-form`, `estimate`) para no reescribir los specs.

### Verificación

- `ng build` sin errores (sigue la advertencia previa de presupuesto en `staff-management.component.css`). El CSS generado contiene las utilidades usadas (`bg-graphite/50`, `grid-cols-[repeat(...)]`, `max-[760px]:…`).
- `ng test` → **21 archivos, 90 pruebas**, todas pasan.
- No se revisó visualmente en el navegador.

### Pendiente

- Ver la segunda parte (abajo).

---

## 2026-11-24 — Migración del CSS a Tailwind CSS v4 (segunda parte: todas las páginas)

### Qué se hizo

- **Migradas las páginas que faltaban** (se borró su `.css` y su `styleUrl`): `login` (y se borró `pages/auth-form.css`, que ya solo usaba el login), `car-detail`, `spare-part-catalog`, `spare-part-detail`, `spare-parts`, `employee-home`, `manager-home`, `employee-profile`, `manager-table`, `employee-test-drives` y `staff-management`. También se borró `app.component.css`, que estaba vacío.
- **Ya no queda ningún CSS de componente.** El único archivo de estilos es `src/styles.css`.
- Nueva sombra en el tema: `--shadow-raised` (`hover:shadow-raised`), que usan las tarjetas de repuestos y del portal del gerente.
- `employee-test-drives` reutiliza las clases compartidas (`ws-page`, `ws-panel`, `ws-note`, `ws-message--success/error`, `ws-table`), porque sus estilos eran casi idénticos.
- Estados visuales que antes eran clases modificadoras ahora salen de atributos:
  - **Miniatura activa** de la galería (`car-detail`): `aria-pressed` y `aria-pressed:border-primary`.
  - **Empleado seleccionado** (`staff-management`): el `aria-current` que ya existía, con `aria-[current=true]:bg-inferno-tint`.
  - **Mensajes de éxito o error** (`spare-part-detail`, `spare-parts`, `employee-profile`, `staff-management`): `[attr.data-type]="messageType()"` y variantes `data-[type=error]:…`.
- Las tarjetas del portal del gerente solo se elevan al pasar el mouse si tienen enlace: `has-[a]:hover:shadow-raised`, sin binding condicional.

### Para qué sirve

Se terminó de quitar el CSS por componente: cada plantilla ya tiene sus estilos. Ya no sale la advertencia de presupuesto de `staff-management.component.css`.

### Por qué así

- **`data-type` / `aria-*` en lugar de `[class.x]`:** Angular no acepta clases con corchetes (`bg-[#edf8ef]`) en `[class.nombre]`. Con un atributo, la plantilla solo dice el estado y Tailwind decide el estilo. `aria-pressed` y `aria-current` además informan el estado a los lectores de pantalla.
- **Estilos de elementos hijos** (tablas, `dl`, formularios con muchos `input`): se usan variantes como `[&_td,&_th]:px-[0.85rem]` en el contenedor, para no repetir lo mismo en cada celda o campo.
- **Ganchos de pruebas:** igual que en la primera parte, se conservaron sin estilos las clases que usan los specs (`gallery__main`, `gallery__thumb`, `specs`, `detail__warning`, `part-card`, `movement-button`, `movement-form`, `message`/`success`/`error`, `task`, `task__link`, `task__badge`, `employee-header__*`, `manager-header__*`, `schedule__car`, `schedule__submit`, `upcoming`, `staff-page__heading`, `staff-detail`, `staff-detail__heading`, `primary-button`, `staff-card`).
- **Breakpoints:** `max-[760px]:` genera `width < 760px`, y antes era `max-width: 760px` (incluye el 760). Solo cambia exactamente en ese píxel.

### Verificación

- `ng build` sin errores **ni advertencias**.
- `ng test` → **21 archivos, 90 pruebas**, todas pasan.
- Se revisó en el CSS generado que las utilidades complejas salen bien: selectores con coma, `[&_input]:focus:`, `calc()` con espacios, `font-[Arial,…]` como `font-family`.
- No se revisó visualmente en el navegador.

### Pendiente

- Ver la tercera parte (abajo).

---

## 2026-11-24 — Migración a Tailwind CSS v4 (tercera parte: Preflight, clases compartidas y header de los portales)

### Qué se hizo

**1. Clases compartidas con `@apply`.** En `styles.css`, todas las clases `.ws-*` y `.btn` (`.btn--ghost`, `.btn--small`, `.ws-pill--*`, `.ws-table`…) se reescribieron con `@apply` de utilidades de Tailwind dentro de `@layer components`. Conservan sus nombres, así que las plantillas y las pruebas no cambian.

**2. Preflight activado.** `styles.css` ahora empieza con `@import 'tailwindcss';` (antes solo cargaba `theme.css` y `utilities.css`). Para que las páginas se vean igual que antes:

| En `@layer base` | Por qué |
|---|---|
| `html { line-height: normal }` | Preflight pone 1.5; la app se diseñó con el valor del navegador |
| Tamaño, peso y margen de `h1`, `h2`, `h3` (2em / 1.5em / 1.17em) | Preflight los deja sin tamaño ni margen |
| Margen vertical de `p` y `dl` (1em) | Preflight quita todos los márgenes |
| `a` con color primario y subrayado | Preflight hace que los enlaces hereden color y no se subrayen |
| `::placeholder { color: #757575 }` | Preflight usa el 50 % del color del texto (contraste ~3:1, poco legible) |
| `cursor: pointer` en botones | Preflight los deja con el cursor normal |
| `--font-sans` en `@theme` con la fuente de CarWeb | `font-sans` y Preflight usan la misma fuente que el resto de la app |

Ajustes en plantillas por el `box-sizing: border-box` de Preflight: `box-content` en los `main` de `car-catalog`, `car-detail`, `spare-part-catalog` y `spare-part-detail`, en las tarjetas `part-card` y en las miniaturas de la galería; sin eso quedaban 32 px más angostos. También se agregaron `h-[90px] w-[120px]` a las miniaturas de fotos de `sell-my-car` (Preflight pone `height: auto` a las imágenes) y la clase `btn` a los botones "Try again" de los catálogos y del detalle del auto, que no tenían estilo.

**3. Modal de citas con estilo.** `appointment-modal` nunca tuvo estilos: su CSS estaba vacío desde que se creó, y se veía como texto plano al final del detalle del auto. Con Preflight sus campos quedaban sin borde. Ahora es un modal de verdad: fondo oscuro, tarjeta centrada, botón ×, campos con borde y botones `btn` / `btn btn--ghost`.

**4. Componente `<app-portal-header>`** (`components/portal-header/`), que reemplaza a `employee-header` y a las copias del header en `employee-home` y `manager-home`.
- Uso: `<app-portal-header />` (portal de empleado, por defecto) o `<app-portal-header portal="manager" />`. Cambia el texto de la insignia ("Employee/Manager portal") y a dónde lleva el logo (`/employee` o `/manager`).
- Contiene el nombre del usuario y el botón *Log out*. Las páginas ya no tienen su propio `logout()`.
- Lo usan `employee-home`, `manager-home`, `employee-appointments` y `employee-test-drives`.
- Ganchos para pruebas: `portal-header__badge`, `portal-header__name`, `portal-header__logout`. Las specs de `employee-home` y `manager-home` se actualizaron a esos nombres, y hay una spec nueva del componente (3 pruebas).

### Para qué sirve

La migración a Tailwind queda completa: Preflight normaliza los estilos entre navegadores, las clases compartidas usan las mismas utilidades que las plantillas y el header de los portales existe una sola vez.

### Por qué así

- **`@apply` en lugar de copiar utilidades en cada plantilla:** `.ws-field`, `.btn`, `.ws-table`… se usan en muchas páginas y en elementos que crea el código (`ws-pill--…`, `ws-message--…`). Mantenerlas como clases evita repetir listas largas de utilidades.
- **Restaurar valores del navegador en `@layer base`:** el objetivo era migrar sin rediseñar. Estas reglas son ahora la tipografía base del proyecto y cualquier utilidad las sobrescribe.
- **`portal` como input:** el header de empleado y el de gerente solo se diferenciaban en el texto de la insignia y el enlace del logo.

### Verificación

- `ng build` sin errores ni advertencias; `ng test` → **22 archivos, 93 pruebas**, todas pasan.
- **Comparación visual en Chrome:** 19 pantallas a 1280 px (públicas con datos reales del backend; las de empleado y gerente con una sesión falsa, por eso muestran los estados de error o vacíos), antes y después de activar Preflight, píxel por píxel.
  - 14 quedaron idénticas.
  - Las diferencias que quedan son menores: el margen por defecto de los checkboxes (3–4 px), `small` al 80 % en lugar de ~83 %, y el fondo gris que el navegador ponía detrás de las miniaturas de la galería.
  - En `employee-profile` y `staff-management`, los botones con `min-h-[2.65rem]` ahora miden 42 px en total: con `border-box` el padding ya no se suma. Es lo que la regla original pretendía; antes medían ~62 px.
- También se revisó el modal de citas y 4 pantallas a 390 px de ancho.

### Pendiente

- En pantallas de ~390 px, el botón ☰ del header público baja a una segunda fila: logo, Catalog, Spare parts, el botón de empleado y ☰ suman unos 407 px. Por esas medidas ya pasaba antes de esta migración.
- `spare-parts` conserva a propósito su fuente Arial y el color `#202b38`.
- Los colores sueltos que quedan (`#edf8ef`, `#fff0ef`, `#b42318`, los de `ws-pill--*`…) podrían pasar al tema como colores de estado (*success*, *warning*, *danger*).

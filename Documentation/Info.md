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

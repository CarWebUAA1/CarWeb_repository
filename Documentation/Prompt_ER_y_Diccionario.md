# Prompt — Diagrama ER (Dia) y Diccionario de datos (Word) de CarWeb

> Copia todo lo que está debajo de la línea y pégalo en el asistente de IA, **adjuntando `CarWebCode/sql/schema.sql`**.

---

Eres un experto en modelado de bases de datos y documentación técnica. Adjunto el archivo `schema.sql` del sistema **CarWeb** (compra-venta de autos, MySQL 8.0.16+, 12 tablas). Con base **únicamente** en ese archivo genera **dos entregables**:

1. **`CarWebER.dia`** — diagrama Entidad-Relación para abrir y editar en **Dia** (0.97.x).
2. **`CarWeb_Diccionario_de_Datos.docx`** — diccionario de datos en Word.

Reglas generales:
- Los nombres de tablas, columnas, tipos, valores ENUM y restricciones se escriben **exactamente** como en el SQL (en inglés). Las descripciones y títulos van en **español**.
- No inventes tablas, columnas ni relaciones. Si algo no está en el SQL, no va.
- Las 12 tablas son: `staff`, `cars`, `spare_parts`, `stock_movements`, `appointments`, `test_drives`, `inspections`, `trades`, `documents`, `contracts`, `receipts`, `price_breakdowns`.

---

## Entregable 1 — Diagrama Entidad-Relación en Dia

### Formato del archivo
- Genera un `.dia` en **XML sin comprimir** (Dia lo abre igual que el comprimido). Raíz `<dia:diagram xmlns:dia="http://www.lysator.liu.se/~alla/dia/">`.
- Una sola capa (`<dia:layer name="Background" visible="true" active="true">`).
- Cada objeto con `id` único (`O0`, `O1`, …) y las conexiones entre objetos con `<dia:connections>` apuntando al `id` y al punto de conexión, para que al mover una caja las líneas la sigan.

### Notación: Chen (hoja "ER" de Dia)
Usa los objetos de la hoja **ER** de Dia:

| Elemento | Objeto Dia | Uso |
|---|---|---|
| Entidad | `ER - Entity` | Un rectángulo por tabla, nombre en singular y PascalCase (`Staff`, `Car`, `SparePart`, `StockMovement`, `Appointment`, `TestDrive`, `Inspection`, `Trade`, `Document`, `Contract`, `Receipt`, `PriceBreakdown`) |
| Atributo | `ER - Attribute` | Una elipse por columna, unida a su entidad con `ER - Participation`. La clave primaria con `key = true` (subrayada). Las columnas multivaluadas (`photos`, JSON) con `multivalued = true`. La derivada `trades.active_car_id` con `derived = true` (línea discontinua) |
| Relación | `ER - Relationship` | Un rombo por cada llave foránea, con el verbo de la tabla de abajo. Cardinalidades en `left_cardinality` / `right_cardinality` |
| Participación | `ER - Participation` | Línea entidad–rombo. `total = true` (doble línea) cuando la FK es `NOT NULL` |

Para no saturar el diagrama: dibuja como atributos todas las columnas **excepto** `created_at` y `updated_at` (agrega una nota con `Standard - Text`: *"Todas las tablas tienen created_at y updated_at"*). No dibujes las FK como atributos: ya están representadas por los rombos.

### Relaciones (las 20 llaves foráneas)

| # | Entidad A | Verbo (rombo) | Entidad B | Card. A : B | Participación de B | Columna FK |
|---|---|---|---|---|---|---|
| 1 | Car | has | SparePart | 1 : N | parcial (NULL) | `spare_parts.car_id` |
| 2 | Car | moves in | StockMovement | 1 : N | parcial (car **o** part) | `stock_movements.car_id` |
| 3 | SparePart | moves in | StockMovement | 1 : N | parcial (car **o** part) | `stock_movements.spare_part_id` |
| 4 | Staff (Manager) | records | StockMovement | 1 : N | total | `stock_movements.manager_id` + `manager_role` |
| 5 | Staff | is assigned to | Appointment | 1 : N | parcial | `appointments.employee_id` |
| 6 | Staff | decides | Appointment | 1 : N | parcial | `appointments.decision_by` |
| 7 | Car | is the subject of | Appointment | 1 : N | parcial | `appointments.car_id` |
| 8 | Appointment | leads to | TestDrive | 1 : 0..1 | total | `test_drives.appointment_id` (UNIQUE) |
| 9 | Staff | accompanies | TestDrive | 1 : N | total | `test_drives.employee_id` |
| 10 | Car | is driven in | TestDrive | 1 : N | total | `test_drives.car_id` |
| 11 | Car | is inspected in | Inspection | 1 : N | total | `inspections.car_id` |
| 12 | Appointment | starts | Trade | 1 : N | total | `trades.appointment_id` |
| 13 | Staff | is responsible for | Trade | 1 : N | total | `trades.employee_id` |
| 14 | Staff (Manager) | approves or rejects | Trade | 1 : N | parcial | `trades.manager_id` + `manager_role` |
| 15 | Car | is traded in | Trade | 1 : N (solo una activa) | parcial (car **o** part) | `trades.car_id` |
| 16 | SparePart | is sold in | Trade | 1 : N | parcial (car **o** part) | `trades.spare_part_id` |
| 17 | Trade | requires | Document | 1 : N (una por tipo) | total, **entidad débil** | `documents.trade_id` (ON DELETE CASCADE) |
| 18 | Trade | is covered by | Contract | 1 : 0..1 | total | `contracts.trade_id` (UNIQUE) |
| 19 | Trade | produces | Receipt | 1 : 0..1 | total | `receipts.trade_id` (UNIQUE) |
| 20 | Trade | has | PriceBreakdown | 1 : 0..1 | total | `price_breakdowns.trade_id` (UNIQUE) |

- `Document` es la única entidad débil (`weak = true`) y su rombo `requires` es identificador (`identifying = true`), porque se borra en cascada con su `Trade`.
- En las relaciones 4 y 14 escribe el rol junto a la línea de `Staff`: "Manager".
- Agrega notas de texto con las reglas que no se ven en la notación:
  - *StockMovement y Trade: exactamente uno de car / spare part (CHECK).*
  - *StockMovement es solo de inserción (triggers impiden UPDATE/DELETE).*
  - *Los datos del cliente viven solo en Appointment (el cliente no tiene cuenta).*

### Distribución
- `Trade` y `Car` al centro (son las entidades con más relaciones). `Staff` arriba, `Appointment` a la izquierda, `TestDrive` e `Inspection` cerca de `Car`, `SparePart` y `StockMovement` a la derecha, y `Document`, `Contract`, `Receipt`, `PriceBreakdown` abajo, alrededor de `Trade`.
- Que ninguna línea cruce una entidad y que las elipses de atributos no se encimen. Tamaño de hoja: A3 horizontal o mayor.
- Título arriba: **"CarWeb — Modelo Entidad-Relación"**.

---

## Entregable 2 — Diccionario de datos en Word

### Estructura del documento
1. **Portada**: "Diccionario de Datos — CarWeb", subtítulo "Sistema de compra-venta de autos", motor (MySQL 8.0.16+, InnoDB, `utf8mb4` / `utf8mb4_0900_ai_ci`) y fecha.
2. **Índice** automático (tabla de contenido de Word).
3. **Introducción** (un párrafo): qué guarda la base, que el cliente no tiene cuenta y sus datos viven en `appointments`, y la política de llaves foráneas (todas `ON DELETE RESTRICT ON UPDATE RESTRICT`, excepto `documents.trade_id` con `ON DELETE CASCADE`).
4. **Una sección por tabla**, en el orden del SQL, con:
   - Título `Heading 1`: nombre de la tabla.
   - **Descripción** en español (a partir del `COMMENT` y de los comentarios del SQL).
   - **Tabla de campos** con estas columnas:

     | Campo | Tipo de dato | Longitud / Precisión | Nulo | Llave | Valor por defecto | Valores permitidos / Restricción | Descripción |
     |---|---|---|---|---|---|---|---|

     - *Tipo de dato*: `INT UNSIGNED`, `VARCHAR`, `CHAR`, `DECIMAL`, `ENUM`, `DATETIME`, `TEXT`, `JSON`, `BOOLEAN`, `TINYINT UNSIGNED`, `SMALLINT`.
     - *Longitud*: `100`, `12,2`, `17`… (vacío si no aplica).
     - *Nulo*: `Sí` / `No`.
     - *Llave*: `PK`, `FK`, `UQ`, combinadas si aplica (`FK, UQ`).
     - *Valor por defecto*: el del SQL (`AUTO_INCREMENT`, `CURRENT_TIMESTAMP`, `'Available'`, `0`, `TRUE`…) o `—`.
     - *Valores permitidos*: la lista completa del ENUM y la regla del CHECK que afecte a esa columna (ej. `year`: "entre 1990 y 2100"; precios: "> 0 si no es NULL").
     - *Descripción*: en español, clara, usando los comentarios del SQL (ej. `password_hash`: "Hash bcrypt de la contraseña; nunca se guarda en texto plano").
   - **Tabla de restricciones** de esa tabla: Nombre | Tipo (PK, UQ, FK, CHECK, INDEX, TRIGGER) | Columnas | Detalle (tabla y columna referenciada, `ON DELETE` / `ON UPDATE`, condición del CHECK o propósito del índice).

5. **Resumen de relaciones**: la misma tabla de 20 relaciones del Entregable 1.
6. **Reglas de negocio implementadas en la base**, una por viñeta:
   - `staff.email` único; bloqueo de inicio de sesión tras 3 intentos fallidos (15 minutos) con `failed_attempts` y `locked_until`.
   - Solo un `staff` con `role = 'Manager'` puede registrar movimientos de inventario o aprobar/rechazar operaciones (FK compuesta a `uq_staff_staff_id_role` + CHECK `manager_role = 'Manager'`).
   - Un movimiento de inventario y una operación se refieren a un auto **o** a una refacción, nunca a ambos ni a ninguno.
   - Las refacciones solo se venden al cliente (`trade_type = 'Purchase'`).
   - Un auto solo puede tener **una** operación activa (`active_car_id` generada + UNIQUE).
   - Apartado de 72 horas (`reserved_until` ≤ `trade_date` + 72 h).
   - Un correo no puede tener dos citas a la misma hora; el token de "modificar o cancelar" se guarda como hash SHA-256.
   - Una prueba de manejo por cita; horario fin > inicio.
   - Un documento de cada tipo por operación; un contrato, un recibo y un desglose de precio por operación.
   - `stock_movements` es solo de inserción (triggers `trg_stock_movements_no_update` y `trg_stock_movements_no_delete`).

### Formato
- Hoja carta, márgenes de 2 cm, **orientación horizontal** en las secciones de tablas (8 columnas no caben en vertical).
- Fuente Calibri o Arial 10 pt en tablas, 11 pt en texto.
- Encabezado de tabla con fondo de color y texto en negritas, que se **repita en cada página**; filas sin cortarse entre páginas.
- Encabezado de página: "CarWeb — Diccionario de Datos". Pie: número de página.

---

Antes de entregar, **verifica** contra el SQL que: estén las 12 tablas, cada tabla tenga todas sus columnas (incluidas `created_at` y `updated_at`), las 20 FK aparezcan en el diagrama y en el diccionario, y todos los valores de ENUM estén completos y bien escritos.

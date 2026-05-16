# Sistema PREP — Programa de Resultados Electorales Preliminares

> "Conteo transparente, accesible y en tiempo real."

---

## Visión

El Sistema PREP es una plataforma de cómputo electoral que digitaliza y valida actas de escrutinio en tiempo real. Integra extracción automática de campos mediante ICR (Azure Form Recognizer), flujos de captura y verificación humana, y validaciones aritméticas instantáneas, todo bajo un esquema de roles estricto que garantiza trazabilidad completa de cada corrección.

---

## Objetivos del proyecto

1. Digitalizar y procesar actas electorales con apoyo de inteligencia artificial (ICR).
2. Proveer flujos diferenciados por rol: capturista, verificador y administrador.
3. Garantizar validación aritmética en tiempo real, tanto en backend como en frontend.
4. Mantener un historial completo y auditable de correcciones campo a campo.
5. Escalar horizontalmente para soportar miles de actas simultáneas durante la jornada electoral.

---

## Arquitectura general

```
## Arquitectura general

![Arquitectura](https://github.com/Alejandrin08/PREParando-IAyudando/tree/main/documentation/Arquitectura.png)
```

---

## Frontends

### 1. Frontend de captura y verificación (`/frontend-captura`)

Interfaz para los dos roles operativos del sistema durante la jornada electoral.

**Capturista**
- Visualiza el acta asignada junto con la imagen original escaneada.
- Revisa los campos extraídos automáticamente por ICR con su nivel de confianza.
- Aprueba o rechaza el acta, enviándola a cola de verificación si detecta inconsistencias.

**Verificador**
- Accede a actas rechazadas por el capturista.
- Corrige campos individuales marcándolos como valor numérico, `ILEGIBLE` o `SIN DATO`.
- Las validaciones aritméticas se recalculan en tiempo real en el frontend, sin llamadas al backend, mostrando el impacto de cada corrección antes de confirmar.
- Contabiliza o rechaza totalmente el acta con un motivo.
- Al contabilizar, un modal de resumen muestra todos los campos modificados, ilegibles y sin dato antes de confirmar el envío.

**Tecnologías**
- React 
- Tailwind CSS

---

### 2. Frontend ciudadano (`/frontend-publico`)

Portal de consulta pública de resultados en tiempo real.

- Consulta de resultados por entidad, municipio y sección.
- Visualización de avance de cómputo y actas contabilizadas.
- Diseño accesible: alto contraste, texto escalable.

**Tecnologías**
- React 
- Tailwind CSS

---

## Backend (`/backend`)

API REST que centraliza la lógica de negocio, los flujos de trabajo y la integración con servicios externos.

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/actas/:id` | Detalle de un acta con campos y validaciones |
| `POST` | `/actas/:id/approve` | Aprobación por capturista |
| `POST` | `/actas/:id/reject` | Rechazo a cola de verificación |
| `POST` | `/actas/:id/correct` | Corrección de campo individual |
| `POST` | `/actas/:id/verify-approve` | Contabilización por verificador |
| `POST` | `/actas/:id/verify-reject` | Rechazo total con motivo oficial |
| `GET` | `/queue` | Cola de trabajo del usuario autenticado |

### Validaciones aritméticas (backend)

El backend ejecuta cuatro reglas sobre cada acta al recibirla y al modificarla:

1. **Suma de votos == total\_votos** — la suma de todos los campos de partido debe coincidir con el total declarado.
2. **total\_votos == total\_votos\_urnas** — consistencia entre el total de votos y el conteo de urnas.
3. **total\_personas\_votaron == total\_votos\_urnas** — quienes votaron coinciden con lo contado en urnas.
4. **total\_votos ≤ lista\_nominal** — el total no supera el padrón de la casilla.


### Tecnologías

- C# con ASP.NET Core
- MySQL
- JWT para autenticación · RBAC para roles

---

## Servicios externos

### Azure Form Recognizer (ICR)

El servicio de extracción automática de campos es el primer paso del flujo de cada acta.

- **Qué hace:** recibe la imagen del acta escaneada y devuelve los campos numéricos (votos por partido, totales, lista nominal) con su valor, posición en la imagen (`boundingRegion`) y nivel de confianza (`Low / Medium / High`).
- **Cómo se integra:** la API Core llama al servicio de forma síncrona al ingresar un acta. 
- **Uso en el frontend:** los `boundingRegion` se usan para dibujar polígonos sobre la imagen del acta. Al seleccionar un campo en la lista, se resalta su región; al hacer clic sobre la imagen, se selecciona el campo correspondiente en la lista.

---

## Roles y permisos

| Rol | Acciones permitidas |
|-----|---------------------|
| `capturista` | Ver actas asignadas · aprobar · rechazar a verificación |
| `verificador` | Ver actas rechazadas · corregir campos · contabilizar · rechazar totalmente |
| `admin` | Gestión de usuarios · colas · reportes · configuración |
| `público` | Consulta de resultados |

---

## Motivos de rechazo oficiales

**Contabilizadas con error**
- `Ilegible` — algún campo no puede leerse en letra ni en número.
- `SinDato` — algún campo no fue asentado ni en letra ni en número.

**No contabilizadas**
- `ExcedeLN` — la suma de votos supera la lista nominal de la casilla.
- `SinActa` — el acta no llegó al CATD (paquete no entregado, casilla no instalada, o paquete sin sobre).
- `TodosIlegibles` — todos los campos de votos son ilegibles o no contienen dato.

---

## Instalación y desarrollo

### Requisitos

- SDK de .NET > 8
- MySQL
- Cuenta de Azure con Form Recognizer habilitado

### Variables de entorno

```appsettings
# Backend
DefaultConnection: "Server=localhost;Port=3306;Database=prep_db;User=root;Password=root;"
AZURE_FORM_RECOGNIZER_ENDPOINT=https://<recurso>.cognitiveservices.azure.com/
AZURE_FORM_RECOGNIZER_KEY=<clave>
JWT_SECRET=<secreto>

```
---

## Consideraciones éticas y de seguridad

- Cada corrección de campo queda registrada con el usuario que la realizó y el valor anterior, garantizando trazabilidad completa.
- Los motivos de rechazo siguen el catálogo oficial del sistema PREP, no son campos libres.
- El sistema no almacena datos biométricos ni información personal de los votantes, solo opera sobre los valores numéricos del acta.

---

## Referencias

- PREP — Instituto Nacional Electoral (INE). Reglamento de Elecciones, Anexo 13.
- Azure Cognitive Services — Form Recognizer documentation.
- WCAG 2.1 — Web Content Accessibility Guidelines, Level AA.
- LFPDPPP — Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
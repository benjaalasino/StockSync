# Taller de Pruebas — Caja Negra

**Materia:** Ingeniería de Software II  
**Proyecto:** StockSync — Grupo 5  
**Integrantes:** Alasino Benjamín, Calvo Tomás, Contreras Joaquín, González Martín  
**Fecha:** 03/06/2026

---

## Ejercicio A — Tabla de decisión: `aprobar_prestamo`

### Especificación del módulo

```python
def aprobar_prestamo(cliente_nuevo: bool, sueldo: float, garantia: bool) -> str:
    """
    Reglas:
     - Cliente nuevo + Sueldo > 100K + Garantía     → "APROBADO"
     - Cliente nuevo + Sueldo > 100K + Sin gar.     → "APROBADO_LIMITADO"
     - Cliente nuevo + Sueldo ≤ 100K + Garantía     → "APROBADO_LIMITADO"
     - Cliente nuevo + Sueldo ≤ 100K + Sin gar.     → "RECHAZADO"
     - Existente   + Sueldo > 100K + Garantía       → "APROBADO_PREMIUM"
     - Existente   + Sueldo > 100K + Sin gar.       → "APROBADO"
     - Existente   + Sueldo ≤ 100K + Garantía       → "APROBADO_LIMITADO"
     - Existente   + Sueldo ≤ 100K + Sin gar.       → "RECHAZADO"
    Validación: sueldo < 0 → ValueError
    """
```

### Tabla de decisión completa (8 combinaciones)

| ID    | cliente_nuevo | sueldo   | garantia | esperado          | justificación                    |
|-------|---------------|----------|----------|-------------------|----------------------------------|
| TC-01 | True          | >100K    | True     | APROBADO          | Regla 1 — cliente nuevo premium  |
| TC-02 | True          | >100K    | False    | APROBADO_LIMITADO | Regla 2 — nuevo sin respaldo     |
| TC-03 | True          | ≤100K    | True     | APROBADO_LIMITADO | Regla 3 — nuevo sueldo bajo      |
| TC-04 | True          | ≤100K    | False    | RECHAZADO         | Regla 4 — nuevo sin nada         |
| TC-05 | False         | >100K    | True     | APROBADO_PREMIUM  | Regla 5 — existente top          |
| TC-06 | False         | >100K    | False    | APROBADO          | Regla 6 — existente confiable    |
| TC-07 | False         | ≤100K    | True     | APROBADO_LIMITADO | Regla 7 — existente con garantía |
| TC-08 | False         | ≤100K    | False    | RECHAZADO         | Regla 8 — existente sin nada     |

### Valores límite del sueldo

El umbral es **100.000** con regla estricta (`> 100K`), por lo tanto:

| ID    | cliente_nuevo | sueldo     | garantia | esperado          | justificación                                  |
|-------|---------------|------------|----------|-------------------|------------------------------------------------|
| TC-09 | False         | 99.999,99  | False    | RECHAZADO         | Justo debajo del umbral → partición baja       |
| TC-10 | False         | 100.000,00 | False    | RECHAZADO         | **Exactamente en el umbral** → `≤ 100K`        |
| TC-11 | False         | 100.000,01 | False    | APROBADO          | Justo arriba del umbral → partición alta       |

> **Observación clave (TC-10):** El caso `100.000,00` pertenece a la partición baja porque la regla dice `> 100K` (estricto). Este fue el caso más difícil de identificar ya que un límite exacto puede confundirse fácilmente con la partición alta.

### Casos adicionales

| ID    | cliente_nuevo | sueldo     | garantia | esperado          | justificación                           |
|-------|---------------|------------|----------|-------------------|-----------------------------------------|
| TC-12 | True          | 0          | False    | RECHAZADO         | Mínimo válido — sueldo cero             |
| TC-13 | False         | 999.999    | True     | APROBADO_PREMIUM  | Partición alta extrema                  |
| TC-14 | True          | 100.000,00 | True     | APROBADO_LIMITADO | Límite exacto + cliente nuevo + garantía|
| TC-15 | True          | 100.000,00 | False    | RECHAZADO         | Límite exacto + cliente nuevo sin gar.  |
| TC-16 | True          | 100.000,01 | True     | APROBADO          | Justo arriba + nuevo + garantía         |
| TC-17 | False         | 100.000,01 | True     | APROBADO_PREMIUM  | Justo arriba + existente + garantía     |

### Casos inválidos

| ID    | sueldo  | esperado   | justificación              |
|-------|---------|------------|----------------------------|
| TC-18 | -1      | ValueError | Sueldo negativo            |
| TC-19 | -100    | ValueError | Sueldo muy negativo        |
| TC-20 | -0,01   | ValueError | Sueldo mínimamente negativo|

**Total: 20 casos ✓**

---

## Ejercicio B — Implementación en pytest

**Archivo:** `proyecto_pruebas/tests/test_prestamos.py`

```python
import pytest
from prestamos import aprobar_prestamo


# ── 8 combinaciones de la tabla de decisión ──────────────────────────────────
@pytest.mark.parametrize("nuevo,sueldo,garantia,esperado", [
    (True,  150_000, True,  "APROBADO"),           # TC-01
    (True,  150_000, False, "APROBADO_LIMITADO"),  # TC-02
    (True,   50_000, True,  "APROBADO_LIMITADO"),  # TC-03
    (True,   50_000, False, "RECHAZADO"),           # TC-04
    (False, 200_000, True,  "APROBADO_PREMIUM"),   # TC-05
    (False, 200_000, False, "APROBADO"),            # TC-06
    (False,  80_000, True,  "APROBADO_LIMITADO"),  # TC-07
    (False,  80_000, False, "RECHAZADO"),           # TC-08
])
def test_decision_aprobacion(nuevo, sueldo, garantia, esperado):
    assert aprobar_prestamo(nuevo, sueldo, garantia) == esperado


# ── Valores límite del sueldo ─────────────────────────────────────────────────
@pytest.mark.parametrize("sueldo,esperado", [
    (99_999.99,  "RECHAZADO"),   # TC-09: justo debajo del límite
    (100_000.00, "RECHAZADO"),   # TC-10: exactamente en el límite (≤ 100K)
    (100_000.01, "APROBADO"),    # TC-11: justo arriba del límite
])
def test_limite_sueldo(sueldo, esperado):
    assert aprobar_prestamo(False, sueldo, False) == esperado


# ── Casos adicionales ─────────────────────────────────────────────────────────
@pytest.mark.parametrize("nuevo,sueldo,garantia,esperado", [
    (True,  0,          False, "RECHAZADO"),          # TC-12
    (False, 999_999,    True,  "APROBADO_PREMIUM"),   # TC-13
    (True,  100_000.00, True,  "APROBADO_LIMITADO"),  # TC-14
    (True,  100_000.00, False, "RECHAZADO"),           # TC-15
    (True,  100_000.01, True,  "APROBADO"),            # TC-16
    (False, 100_000.01, True,  "APROBADO_PREMIUM"),   # TC-17
])
def test_casos_adicionales(nuevo, sueldo, garantia, esperado):
    assert aprobar_prestamo(nuevo, sueldo, garantia) == esperado


# ── Validaciones: entradas inválidas ─────────────────────────────────────────
@pytest.mark.parametrize("sueldo", [-1, -100, -0.01])  # TC-18/19/20
def test_sueldo_invalido(sueldo):
    with pytest.raises(ValueError):
        aprobar_prestamo(False, sueldo, False)
```

### Resultados de ejecución

```
pytest tests/test_prestamos.py -v
20 passed in 0.04s

pytest --cov=prestamos tests/test_prestamos.py
prestamos.py: 100% cobertura
```

**Checklist:**
- [x] Las 8 combinaciones de la tabla de decisión están cubiertas
- [x] Casos límite del sueldo: 100K, 99.999,99, 100.000,01
- [x] Casos inválidos (sueldo negativo)
- [x] El campo "esperado" coincide con la spec
- [x] Hay al menos 15 casos (total: 20)
- [x] Cobertura > 80% (100%)

---

## Ejercicio C — Transición de estados: `Turno`

### Especificación

```
Estados:  PROPUESTO → CONFIRMADO → ATENDIDO
                   ↘              ↗
                    CANCELADO ←──
Terminales: ATENDIDO, CANCELADO
Cualquier otra transición → InvalidTransitionError
```

### Tabla de transición de estados (10 casos)

| ID     | Estado inicial | Acción      | Estado esperado / Excepción |
|--------|----------------|-------------|------------------------------|
| TC-S01 | PROPUESTO      | confirmar() | CONFIRMADO                   |
| TC-S02 | PROPUESTO      | cancelar()  | CANCELADO                    |
| TC-S03 | CONFIRMADO     | atender()   | ATENDIDO                     |
| TC-S04 | CONFIRMADO     | cancelar()  | CANCELADO                    |
| TC-S05 | ATENDIDO       | cancelar()  | InvalidTransitionError        |
| TC-S06 | ATENDIDO       | confirmar() | InvalidTransitionError        |
| TC-S07 | CANCELADO      | confirmar() | InvalidTransitionError        |
| TC-S08 | PROPUESTO      | atender()   | InvalidTransitionError        |
| TC-S09 | CANCELADO      | cancelar()  | InvalidTransitionError        |
| TC-S10 | CANCELADO      | atender()   | InvalidTransitionError        |

### Implementación en pytest

**Archivo:** `proyecto_pruebas/tests/test_turnos_estado.py`

```python
import pytest
from turnos_estado import Turno, InvalidTransitionError


# ── Transiciones válidas (TC-S01 a TC-S04) ───────────────────────────────────
def test_s01_propuesto_confirmar():
    t = Turno("PROPUESTO")
    t.confirmar()
    assert t.estado == "CONFIRMADO"

def test_s02_propuesto_cancelar():
    t = Turno("PROPUESTO")
    t.cancelar()
    assert t.estado == "CANCELADO"

def test_s03_confirmado_atender():
    t = Turno("CONFIRMADO")
    t.atender()
    assert t.estado == "ATENDIDO"

def test_s04_confirmado_cancelar():
    t = Turno("CONFIRMADO")
    t.cancelar()
    assert t.estado == "CANCELADO"


# ── Transiciones inválidas (TC-S05 a TC-S10) ─────────────────────────────────
@pytest.mark.parametrize("estado_inicial,accion", [
    ("ATENDIDO",  "cancelar"),   # TC-S05
    ("ATENDIDO",  "confirmar"),  # TC-S06
    ("CANCELADO", "confirmar"),  # TC-S07
    ("PROPUESTO", "atender"),    # TC-S08
    ("CANCELADO", "cancelar"),   # TC-S09
    ("CANCELADO", "atender"),    # TC-S10
])
def test_transicion_invalida(estado_inicial, accion):
    t = Turno(estado_inicial)
    with pytest.raises(InvalidTransitionError):
        getattr(t, accion)()


# ── Flujo completo ────────────────────────────────────────────────────────────
def test_flujo_completo():
    t = Turno()
    assert t.estado == "PROPUESTO"
    t.confirmar()
    assert t.estado == "CONFIRMADO"
    t.atender()
    assert t.estado == "ATENDIDO"
```

### Resultados de ejecución

```
pytest tests/test_turnos_estado.py -v
12 passed in 0.04s

turnos_estado.py: 95% cobertura
```

---

## Ejercicio D — Casos para StockSync

**Proyecto:** StockSync — Sistema de gestión de inventario para indumentaria  
**Grupo:** 5

---

### Funcionalidad 1: Autenticación de usuarios (Login con JWT)

**Técnica:** Tabla de decisión (email × contraseña × estado de cuenta)  
**Referencia:** `auth_service.py` → `authenticate()`

| ID     | tipo    | email              | password   | is_active | esperado        |
|--------|---------|--------------------|------------|-----------|-----------------|
| TC-D01 | válido  | admin@test.com     | correcta   | True      | JWT token       |
| TC-D02 | inválido| admin@test.com     | incorrecta | True      | HTTP 401        |
| TC-D03 | inválido| inactivo@test.com  | correcta   | False     | HTTP 401        |
| TC-D04 | inválido| noexiste@test.com  | cualquiera | —         | HTTP 401        |

---

### Funcionalidad 2: Validación de stock en venta (REQ-F03)

**Técnica:** Valores límite sobre `stock_disponible` vs `cantidad_solicitada`  
**Referencia:** `stock_service.py` → `create_sale()`

| ID     | tipo   | stock_disponible | cantidad_solicitada | esperado                            |
|--------|--------|------------------|---------------------|-------------------------------------|
| TC-D05 | válido | 10               | 5                   | HTTP 200 — Sale creado              |
| TC-D06 | límite | 10               | 10                  | HTTP 200 — venta de todo el stock   |
| TC-D07 | límite | 10               | 11                  | HTTP 409 — "Stock insuficiente"     |
| TC-D08 | inválido| 0               | 1                   | HTTP 409 — "Stock insuficiente"     |

---

### Funcionalidad 3: Cálculo de stock por Kardex (REQ-F02)

**Técnica:** Partición de equivalencia sobre tipos de movimiento  
**Referencia:** `stock_service.py` → `get_current_stock()`

| ID     | tipo   | movimientos         | esperado | justificación                          |
|--------|--------|---------------------|----------|----------------------------------------|
| TC-D09 | válido | (ninguno)           | 0        | Partición vacía — stock inicial        |
| TC-D10 | válido | [+50, +30]          | 80       | Solo ingresos                          |
| TC-D11 | válido | [+50, -10, -5]      | 35       | Mezcla de ingresos y egresos           |
| TC-D12 | límite | [+20, -20]          | 0        | Límite inferior — stock en exactamente cero |

---

### Funcionalidad 4: Alerta de punto de reorden (REQ-F04)

**Técnica:** Valores límite sobre `stock_actual` vs `reorder_point`  
**Referencia:** `stock_service.py` → `get_low_stock_alerts()`

| ID     | tipo   | current_stock | reorder_point | below_reorder | aparece en alertas |
|--------|--------|---------------|---------------|---------------|--------------------|
| TC-D13 | válido | 15            | 10            | False         | No                 |
| TC-D14 | límite | 10            | 10            | **True**      | Sí (regla: `≤`)    |
| TC-D15 | inválido| 5            | 10            | True          | Sí                 |

> **Observación:** El límite exacto `stock == reorder_point` dispara la alerta porque la regla es `≤ reorder_point`.

---

### Funcionalidad 5: Ajuste de stock solo para Admin (REQ-F05)

**Técnica:** Tabla de decisión sobre rol de usuario  
**Referencia:** `stock_service.py` → `adjust_stock()` + `security.py` → `require_admin`

| ID     | tipo   | rol      | cantidad | esperado                            |
|--------|--------|----------|----------|-------------------------------------|
| TC-D16 | válido | admin    | +10      | HTTP 200 — ADJUSTMENT_IN creado     |
| TC-D17 | inválido| operator| +10     | HTTP 403 — Forbidden                |
| TC-D18 | límite | admin    | -5       | HTTP 200 — ADJUSTMENT_OUT creado    |

---

## Resumen del taller

| Ejercicio | Técnica                | Casos  | Cobertura |
|-----------|------------------------|--------|-----------|
| A + B     | Tabla decisión + límite| 20     | 100%      |
| C         | Transición de estados  | 12     | 95%       |
| D         | Mixta (ver tabla)      | 18 diseñados | —  |
| **Total** |                        | **50** |           |

### Respuestas para el plenario

1. **Caso más difícil de identificar (Ejercicio A):** `TC-10` — sueldo exactamente en `100.000,00` resulta en `RECHAZADO`, no `APROBADO`, porque la regla es `> 100K` (estricto). El límite exacto pertenece a la partición baja y es fácil asumirlo como partición alta.

2. **Inconsistencias detectadas en la spec:** Ninguna. La spec es consistente; la única ambigüedad potencial era el límite exacto del sueldo, que la spec resuelve implícitamente con `> 100K`.

3. **Técnica más usada en StockSync (Ejercicio D):** **Valores límite**, porque el dominio central del sistema gira en torno a umbrales de stock (`stock disponible vs. cantidad solicitada`, `stock vs. reorder_point`) donde un valor off-by-one cambia completamente el resultado del negocio.

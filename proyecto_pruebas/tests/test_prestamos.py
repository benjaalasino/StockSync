"""
Ejercicio A + B — Pruebas de caja negra para prestamos.py
Técnicas: Tabla de decisión (8 combinaciones) + Valores límite del sueldo

Tabla de decisión completa:
┌───────────┬──────────┬──────────┬──────────────────┐
│ cliente_nuevo │  sueldo  │ garantia │     resultado    │
├───────────┬──────────┬──────────┬──────────────────┤
│   True    │  >100K   │  True    │ APROBADO         │
│   True    │  >100K   │  False   │ APROBADO_LIMITADO│
│   True    │  ≤100K   │  True    │ APROBADO_LIMITADO│
│   True    │  ≤100K   │  False   │ RECHAZADO        │
│   False   │  >100K   │  True    │ APROBADO_PREMIUM │
│   False   │  >100K   │  False   │ APROBADO         │
│   False   │  ≤100K   │  True    │ APROBADO_LIMITADO│
│   False   │  ≤100K   │  False   │ RECHAZADO        │
└───────────┴──────────┴──────────┴──────────────────┘

Valores límite del sueldo (con existente=False, garantia=False):
  99999.99  → RECHAZADO        (justo debajo del umbral)
 100000.00  → RECHAZADO        (exactamente en el umbral, regla es > 100K)
 100000.01  → APROBADO         (justo arriba del umbral)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from prestamos import aprobar_prestamo


# ── Ejercicio A: 8 combinaciones de la tabla de decisión ─────────────────────
@pytest.mark.parametrize(
    "nuevo,sueldo,garantia,esperado",
    [
        # TC-01: cliente nuevo, sueldo alto, con garantía → APROBADO
        (True, 150_000, True, "APROBADO"),
        # TC-02: cliente nuevo, sueldo alto, sin garantía → APROBADO_LIMITADO
        (True, 150_000, False, "APROBADO_LIMITADO"),
        # TC-03: cliente nuevo, sueldo bajo, con garantía → APROBADO_LIMITADO
        (True, 50_000, True, "APROBADO_LIMITADO"),
        # TC-04: cliente nuevo, sueldo bajo, sin garantía → RECHAZADO
        (True, 50_000, False, "RECHAZADO"),
        # TC-05: cliente existente, sueldo alto, con garantía → APROBADO_PREMIUM
        (False, 200_000, True, "APROBADO_PREMIUM"),
        # TC-06: cliente existente, sueldo alto, sin garantía → APROBADO
        (False, 200_000, False, "APROBADO"),
        # TC-07: cliente existente, sueldo bajo, con garantía → APROBADO_LIMITADO
        (False, 80_000, True, "APROBADO_LIMITADO"),
        # TC-08: cliente existente, sueldo bajo, sin garantía → RECHAZADO
        (False, 80_000, False, "RECHAZADO"),
    ],
)
def test_decision_aprobacion(nuevo, sueldo, garantia, esperado):
    assert aprobar_prestamo(nuevo, sueldo, garantia) == esperado


# ── Valores límite del sueldo ─────────────────────────────────────────────────
@pytest.mark.parametrize(
    "sueldo,esperado",
    [
        # TC-09: justo debajo del límite (≤ 100K → bajo)
        (99_999.99, "RECHAZADO"),
        # TC-10: exactamente en el límite (100K no es > 100K)
        (100_000.00, "RECHAZADO"),
        # TC-11: justo arriba del límite (> 100K → alto)
        (100_000.01, "APROBADO"),
    ],
)
def test_limite_sueldo(sueldo, esperado):
    # existente=False, garantia=False para aislar la variable sueldo
    assert aprobar_prestamo(False, sueldo, False) == esperado


# ── Casos adicionales para completar los 15+ ─────────────────────────────────
@pytest.mark.parametrize(
    "nuevo,sueldo,garantia,esperado",
    [
        # TC-12: sueldo = 0 (válido, mínimo permitido)
        (True, 0, False, "RECHAZADO"),
        # TC-13: sueldo muy alto (partición válida de sueldo alto)
        (False, 999_999, True, "APROBADO_PREMIUM"),
        # TC-14: límite exacto con cliente nuevo y garantía
        (True, 100_000.00, True, "APROBADO_LIMITADO"),
        # TC-15: límite exacto con cliente nuevo sin garantía
        (True, 100_000.00, False, "RECHAZADO"),
        # TC-16: justo arriba del límite, cliente nuevo con garantía
        (True, 100_000.01, True, "APROBADO"),
        # TC-17: justo arriba del límite, cliente existente con garantía
        (False, 100_000.01, True, "APROBADO_PREMIUM"),
    ],
)
def test_casos_adicionales(nuevo, sueldo, garantia, esperado):
    assert aprobar_prestamo(nuevo, sueldo, garantia) == esperado


# ── Validaciones: entradas inválidas ─────────────────────────────────────────
@pytest.mark.parametrize("sueldo", [-1, -100, -0.01])
def test_sueldo_invalido(sueldo):
    # TC-18/19/20
    with pytest.raises(ValueError):
        aprobar_prestamo(False, sueldo, False)

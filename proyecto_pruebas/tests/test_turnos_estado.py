"""
Ejercicio C — Pruebas de transición de estados para turnos_estado.py

Tabla de transición de estados:
┌────────┬───────────────┬────────────┬───────────────────────┐
│  ID    │ Estado inicial│   Acción   │ Estado esperado /     │
│        │               │            │ Excepción             │
├────────┼───────────────┼────────────┼───────────────────────┤
│ TC-S01 │ PROPUESTO     │ confirmar()│ CONFIRMADO            │
│ TC-S02 │ PROPUESTO     │ cancelar() │ CANCELADO             │
│ TC-S03 │ CONFIRMADO    │ atender()  │ ATENDIDO              │
│ TC-S04 │ CONFIRMADO    │ cancelar() │ CANCELADO             │
│ TC-S05 │ ATENDIDO      │ cancelar() │ InvalidTransitionError│
│ TC-S06 │ ATENDIDO      │ confirmar()│ InvalidTransitionError│
│ TC-S07 │ CANCELADO     │ confirmar()│ InvalidTransitionError│
│ TC-S08 │ PROPUESTO     │ atender()  │ InvalidTransitionError│
│ TC-S09 │ CANCELADO     │ cancelar() │ InvalidTransitionError│
│ TC-S10 │ CANCELADO     │ atender()  │ InvalidTransitionError│
└────────┴───────────────┴────────────┴───────────────────────┘
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from turnos_estado import Turno, InvalidTransitionError


# ── Transiciones válidas ──────────────────────────────────────────────────────
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


# ── Transiciones inválidas ────────────────────────────────────────────────────
@pytest.mark.parametrize(
    "estado_inicial,accion",
    [
        # TC-S05: terminal ATENDIDO no puede cancelar
        ("ATENDIDO", "cancelar"),
        # TC-S06: terminal ATENDIDO no puede confirmar
        ("ATENDIDO", "confirmar"),
        # TC-S07: terminal CANCELADO no puede confirmar
        ("CANCELADO", "confirmar"),
        # TC-S08: PROPUESTO no puede atender (salto de estado)
        ("PROPUESTO", "atender"),
        # TC-S09: terminal CANCELADO no puede cancelar de nuevo
        ("CANCELADO", "cancelar"),
        # TC-S10: terminal CANCELADO no puede atender
        ("CANCELADO", "atender"),
    ],
)
def test_transicion_invalida(estado_inicial, accion):
    t = Turno(estado_inicial)
    metodo = getattr(t, accion)
    with pytest.raises(InvalidTransitionError):
        metodo()


# ── Estado inicial por defecto ────────────────────────────────────────────────
def test_estado_inicial_por_defecto():
    t = Turno()
    assert t.estado == "PROPUESTO"


# ── Flujo completo válido ─────────────────────────────────────────────────────
def test_flujo_completo_propuesto_confirmado_atendido():
    t = Turno()
    t.confirmar()
    assert t.estado == "CONFIRMADO"
    t.atender()
    assert t.estado == "ATENDIDO"

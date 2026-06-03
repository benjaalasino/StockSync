"""
Ejercicio D — Casos de prueba para StockSync (Trabajo de Campo — Grupo 5)
Proyecto: StockSync — Sistema de gestión de inventario para indumentaria
Grupo Nº: 5

Funcionalidades seleccionadas (5 más críticas):
  F1 — Autenticación de usuarios (login con JWT)
  F2 — Validación de stock en venta (sin saldos negativos — REQ-F03)
  F3 — Cálculo de stock actual vía Kardex (REQ-F02)
  F4 — Alerta de punto de reorden (REQ-F04)
  F5 — Aprobación de préstamo / ajuste de stock solo Admin (REQ-F05)

Técnica dominante: Tabla de decisión + Valores límite
"""

# =============================================================================
# TABLA DE CASOS DE PRUEBA — EJERCICIO D
# =============================================================================
#
# F1 — Autenticación de usuarios
# Técnica: Tabla de decisión (email × contraseña × usuario activo)
# ─────────────────────────────────────────────────────────────────────────────
# TC-D01 (válido):
#   Entrada:  email="admin@test.com", password="correcta", usuario activo=True
#   Esperado: JWT token (string no vacío)
#   Justificación: partición válida — credenciales correctas y usuario activo
#
# TC-D02 (inválido — contraseña incorrecta):
#   Entrada:  email="admin@test.com", password="incorrecta", usuario activo=True
#   Esperado: HTTP 401 Unauthorized
#   Justificación: partición inválida — contraseña no coincide
#
# TC-D03 (inválido — usuario inactivo):
#   Entrada:  email="inactivo@test.com", password="correcta", usuario activo=False
#   Esperado: HTTP 401 Unauthorized
#   Justificación: usuario desactivado no puede autenticarse
#
# TC-D04 (inválido — email inexistente):
#   Entrada:  email="noexiste@test.com", password="cualquiera"
#   Esperado: HTTP 401 Unauthorized
#   Justificación: el usuario no existe en la base de datos
#
# =============================================================================
# F2 — Validación de stock en venta (REQ-F03)
# Técnica: Valores límite sobre cantidad disponible
# ─────────────────────────────────────────────────────────────────────────────
# TC-D05 (válido — exactamente el stock disponible):
#   Entrada:  stock_disponible=10, cantidad_solicitada=10
#   Esperado: Venta aprobada (HTTP 200, Sale creado)
#   Justificación: límite exacto — venta de todo el inventario disponible
#
# TC-D06 (válido — cantidad menor al disponible):
#   Entrada:  stock_disponible=10, cantidad_solicitada=5
#   Esperado: Venta aprobada (HTTP 200)
#   Justificación: partición válida, stock suficiente
#
# TC-D07 (límite — un ítem más de lo disponible):
#   Entrada:  stock_disponible=10, cantidad_solicitada=11
#   Esperado: HTTP 409 Conflict, detalle "Stock insuficiente"
#   Justificación: valor límite superior — cruza el umbral de stock
#
# TC-D08 (inválido — stock = 0):
#   Entrada:  stock_disponible=0, cantidad_solicitada=1
#   Esperado: HTTP 409 Conflict
#   Justificación: partición inválida — sin stock disponible
#
# =============================================================================
# F3 — Cálculo de stock actual vía Kardex (REQ-F02)
# Técnica: Partición de equivalencia sobre tipos de movimiento
# ─────────────────────────────────────────────────────────────────────────────
# TC-D09 (válido — sin movimientos):
#   Entrada:  variant con 0 movimientos
#   Esperado: get_current_stock() == 0
#   Justificación: partición vacía — stock inicial es cero
#
# TC-D10 (válido — solo ingresos):
#   Entrada:  movimientos [+50, +30]
#   Esperado: get_current_stock() == 80
#   Justificación: partición de solo entradas
#
# TC-D11 (válido — ingresos y egresos mezclados):
#   Entrada:  movimientos [+50, -10, -5]
#   Esperado: get_current_stock() == 35
#   Justificación: partición mixta — verifica que la sumatoria es correcta
#
# TC-D12 (límite — stock en cero tras egresos):
#   Entrada:  movimientos [+20, -20]
#   Esperado: get_current_stock() == 0
#   Justificación: límite inferior — el Kardex no debe generar negativos
#
# =============================================================================
# F4 — Alerta de punto de reorden (REQ-F04)
# Técnica: Valores límite sobre stock vs reorder_point
# ─────────────────────────────────────────────────────────────────────────────
# TC-D13 (válido — stock > reorder_point):
#   Entrada:  current_stock=15, reorder_point=10
#   Esperado: below_reorder=False (no aparece en alertas)
#   Justificación: partición normal, no hay alerta
#
# TC-D14 (límite — stock == reorder_point):
#   Entrada:  current_stock=10, reorder_point=10
#   Esperado: below_reorder=True (aparece en alertas)
#   Justificación: límite exacto — la regla es stock ≤ reorder_point
#
# TC-D15 (inválido — stock < reorder_point):
#   Entrada:  current_stock=5, reorder_point=10
#   Esperado: below_reorder=True (aparece en alertas)
#   Justificación: partición de alerta activa
#
# =============================================================================
# F5 — Ajuste de stock solo para Admin (REQ-F05)
# Técnica: Tabla de decisión sobre rol de usuario
# ─────────────────────────────────────────────────────────────────────────────
# TC-D16 (válido — admin puede ajustar):
#   Entrada:  usuario.role="admin", ajuste=+10
#   Esperado: HTTP 200, StockMovement tipo ADJUSTMENT_IN creado
#   Justificación: rol autorizado, operación válida
#
# TC-D17 (inválido — operator no puede ajustar):
#   Entrada:  usuario.role="operator", ajuste=+10
#   Esperado: HTTP 403 Forbidden
#   Justificación: rol no autorizado para ajustes manuales
#
# TC-D18 (límite — ajuste negativo por admin):
#   Entrada:  usuario.role="admin", ajuste=-5
#   Esperado: HTTP 200, StockMovement tipo ADJUSTMENT_OUT creado
#   Justificación: ajuste negativo válido (egreso de ajuste)
#
# =============================================================================

# Resumen ejecutivo para el plenario:
# ─────────────────────────────────────────────────────────────────────────────
# Funcionalidades probadas: 5
# Casos diseñados: 18 (TC-D01 a TC-D18)
# Técnicas aplicadas:
#   - Tabla de decisión: F1 (credenciales), F5 (roles)
#   - Valores límite:    F2 (stock disponible vs solicitado), F4 (reorder_point)
#   - Partición:         F3 (tipos de movimiento en Kardex)
#
# Caso más difícil de identificar (Ejercicio A):
#   TC-10 — sueldo exactamente en 100_000.00 → es RECHAZADO porque la regla
#   dice "> 100K" (estricto). El límite exacto pertenece a la partición baja.
#
# Técnica más usada en el proyecto: Valores límite (stock es muy sensible
#   al límite entre "hay stock" y "no hay stock").

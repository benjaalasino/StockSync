def aprobar_prestamo(cliente_nuevo: bool, sueldo: float, garantia: bool) -> str:
    """Decide la aprobación de un préstamo.

    Reglas (tabla de decisión):
     - Cliente nuevo + Sueldo > 100K + Garantía     → "APROBADO"
     - Cliente nuevo + Sueldo > 100K + Sin gar.     → "APROBADO_LIMITADO"
     - Cliente nuevo + Sueldo ≤ 100K + Garantía     → "APROBADO_LIMITADO"
     - Cliente nuevo + Sueldo ≤ 100K + Sin gar.     → "RECHAZADO"
     - Existente   + Sueldo > 100K + Garantía       → "APROBADO_PREMIUM"
     - Existente   + Sueldo > 100K + Sin gar.       → "APROBADO"
     - Existente   + Sueldo ≤ 100K + Garantía       → "APROBADO_LIMITADO"
     - Existente   + Sueldo ≤ 100K + Sin gar.       → "RECHAZADO"

    Validaciones:
     - sueldo < 0 → ValueError
    """
    if sueldo < 0:
        raise ValueError(f"El sueldo no puede ser negativo: {sueldo}")

    alto = sueldo > 100_000

    if cliente_nuevo:
        if alto and garantia:
            return "APROBADO"
        elif alto and not garantia:
            return "APROBADO_LIMITADO"
        elif not alto and garantia:
            return "APROBADO_LIMITADO"
        else:
            return "RECHAZADO"
    else:
        if alto and garantia:
            return "APROBADO_PREMIUM"
        elif alto and not garantia:
            return "APROBADO"
        elif not alto and garantia:
            return "APROBADO_LIMITADO"
        else:
            return "RECHAZADO"

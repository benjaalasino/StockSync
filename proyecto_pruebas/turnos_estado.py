class InvalidTransitionError(Exception):
    pass


class Turno:
    """Estados posibles: PROPUESTO, CONFIRMADO, ATENDIDO, CANCELADO

    Transiciones válidas:
        PROPUESTO  -> CONFIRMADO  (.confirmar())
        PROPUESTO  -> CANCELADO   (.cancelar())
        CONFIRMADO -> ATENDIDO    (.atender())
        CONFIRMADO -> CANCELADO   (.cancelar())

    Estados terminales: ATENDIDO, CANCELADO
    Cualquier otra transición → InvalidTransitionError
    """

    ESTADOS_VALIDOS = {"PROPUESTO", "CONFIRMADO", "ATENDIDO", "CANCELADO"}

    def __init__(self, estado: str = "PROPUESTO"):
        if estado not in self.ESTADOS_VALIDOS:
            raise ValueError(f"Estado inválido: {estado}")
        self.estado = estado

    def confirmar(self):
        if self.estado != "PROPUESTO":
            raise InvalidTransitionError(
                f"No se puede confirmar desde el estado {self.estado}"
            )
        self.estado = "CONFIRMADO"

    def cancelar(self):
        if self.estado not in ("PROPUESTO", "CONFIRMADO"):
            raise InvalidTransitionError(
                f"No se puede cancelar desde el estado {self.estado}"
            )
        self.estado = "CANCELADO"

    def atender(self):
        if self.estado != "CONFIRMADO":
            raise InvalidTransitionError(
                f"No se puede atender desde el estado {self.estado}"
            )
        self.estado = "ATENDIDO"

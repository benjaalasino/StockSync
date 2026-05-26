# 01 — Migración de base de datos

## Qué se agrega

1. Nueva tabla `clients`
2. Nueva columna `client_id` en la tabla `sales`

## Pasos

### 1. Generar la migración con Alembic

Desde dentro del contenedor o con el entorno virtual activo:

```bash
alembic revision --autogenerate -m "add_clients_table_and_client_id_to_sales"
```

Verificar que el archivo generado en `backend/alembic/versions/` contenga los dos cambios. Si `autogenerate` no los detecta, escribir la migración a mano (ver sección siguiente).

### 2. Migración manual (si autogenerate no alcanza)

```python
# backend/alembic/versions/xxxx_add_clients_table_and_client_id_to_sales.py

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_clients_id", "clients", ["id"])
    op.create_index("ix_clients_email", "clients", ["email"])

    op.add_column(
        "sales",
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id"), nullable=True),
    )
    op.create_index("ix_sales_client_id", "sales", ["client_id"])


def downgrade():
    op.drop_index("ix_sales_client_id", table_name="sales")
    op.drop_column("sales", "client_id")
    op.drop_index("ix_clients_email", table_name="clients")
    op.drop_index("ix_clients_id", table_name="clients")
    op.drop_table("clients")
```

### 3. Aplicar la migración

```bash
alembic upgrade head
```

Al hacer `docker compose up --build` esto corre automáticamente (el `entrypoint` del backend ya tiene `alembic upgrade head`).

## Resultado esperado

- Tabla `clients` existe con todas sus columnas
- Tabla `sales` tiene la columna `client_id` (nullable, FK a `clients.id`)
- Las filas existentes en `sales` tienen `client_id = NULL` (no se rompe nada)

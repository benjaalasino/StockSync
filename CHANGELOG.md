# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-16

Versión de entrega final del trabajo de campo integrador de Ingeniería de Software II.

### Added

- **Gestión de Clientes (REQ-F06):**
  - Se agregó un módulo completo para el CRUD (Crear, Leer, Actualizar, Eliminar) de clientes.
  - Las operaciones de escritura (crear, actualizar, eliminar) están restringidas a usuarios con rol `Admin`.
  - La eliminación de clientes es lógica (`is_active = false`).
- **Asociación de Ventas a Clientes:**
  - Las ventas ahora pueden asociarse a un cliente existente.
  - El endpoint de creación de ventas (`POST /stock/sales`) acepta un `client_id` opcional.
- **Nuevas Páginas en Frontend:**
  - Se creó la página `/clients` para la gestión de clientes.
  - Se creó la página `/sales` para el registro de ventas, incluyendo un selector de clientes.
- **Pruebas de Cobertura:**
  - Se agregaron 11 nuevos tests para cubrir la funcionalidad de Clientes y su integración con Ventas, elevando el total a **59 tests**.

### Changed

- **Páginas de Productos y Ventas:**
  - Las vistas de Productos y Ventas en el frontend ahora consumen datos reales desde la API, reemplazando los datos estáticos.
- **Navegación Principal:**
  - Se actualizaron el menú lateral y el enrutador para incluir las nuevas secciones de "Clientes" y "Ventas".
- **Métricas de Calidad:**
  - La cobertura de pruebas del backend aumentó a **92.15%**.
  - La densidad de defectos mejoró, bajando a **0.84 defectos/KLOC**.

### Fixed

- Se corrigieron errores menores detectados por el linter (Ruff) para mejorar la calidad y consistencia del código.
- Se resolvió una incompatibilidad de versiones entre las librerías `bcrypt` y `passlib` haciendo downgrade de `bcrypt`.

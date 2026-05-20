export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Productos</p>
            <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Catálogo de inventario</h1>
          </div>
          <button className="rounded-2xl bg-primary px-5 py-3 text-body-md font-semibold text-on-primary transition hover:bg-primary-container">
            Agregar producto</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { title: "Adaptador USB-C", stock: 72, category: "Accesorios" },
          { title: "Teclado mecánico", stock: 24, category: "Periféricos" },
          { title: "Monitor 27''", stock: 11, category: "Pantallas" },
        ].map((product) => (
          <div key={product.title} className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
              {product.category}</p>
            <h2 className="mt-4 text-headline-md font-semibold text-on-surface">{product.title}</h2>
            <p className="mt-4 text-body-md text-on-surface-variant">Stock disponible: <span className="font-semibold text-on-surface">{product.stock} unidades</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

# 📱 Gestor de Productos y Ventas

Una aplicación web móvil para gestionar productos, calcular precios unitarios, establecer márgenes de ganancia y hacer seguimiento de ventas.

## Características

- ✅ **Calcular precio por unidad**: Ingresa el costo total y la cantidad comprada para obtener automáticamente el costo unitario
- 💰 **Configurar margen de ganancia**: Define el porcentaje de ganancia deseado para cada producto
- 📊 **Seguimiento de ventas**: Registra cuántas unidades se han vendido de cada producto
- 🏆 **Producto más vendido**: Identifica automáticamente cuál es el producto estrella
- 💾 **Almacenamiento local**: Los datos se guardan automáticamente en el navegador
- 📱 **Diseño responsive**: Funciona perfectamente en celulares y tablets

## Cómo usar

1. Abre `index.html` en tu navegador
2. Completa el formulario para agregar un producto:
   - Nombre del producto
   - Costo total de la compra
   - Cantidad de unidades compradas
   - Margen de ganancia deseado (%)
3. Haz clic en "Agregar Producto"
4. Para vender unidades:
   - Ingresa la cantidad a vender
   - Haz clic en "Vender"
5. Consulta las estadísticas:
   - Total vendido
   - Ingresos totales
   - Ganancia total
   - Producto más vendido

## Funcionalidades Implementadas

### Gestión de Productos
- Agregar productos con costo total y cantidad
- Cálculo automático del precio unitario: `Costo Total ÷ Cantidad`
- Cálculo del precio de venta: `Precio Unitario × (1 + Margen/100)`
- Visualización de ganancia por unidad

### Control de Ventas
- Registrar ventas de cualquier cantidad disponible
- Actualización automática de inventario
- Seguimiento de unidades vendidas y restantes

### Estadísticas
- **Total Vendido**: Suma de todas las unidades vendidas
- **Ingresos Totales**: Suma de (Unidades Vendidas × Precio de Venta)
- **Ganancia Total**: Suma de (Unidades Vendidas × Ganancia por Unidad)
- **Producto Estrella**: Producto con más unidades vendidas (marcado con 🏆)

## Tecnologías

- HTML5
- CSS3 (con diseño responsive)
- JavaScript (ES6+)
- LocalStorage para persistencia de datos

## Instalación

No requiere instalación. Simplemente abre `index.html` en cualquier navegador web moderno.

Para desarrollo local con servidor HTTP:
```bash
python3 -m http.server 8000
# Luego abre http://localhost:8000 en tu navegador
```

## Capturas de Pantalla

La aplicación presenta un diseño moderno y atractivo con:
- Gradiente morado en el fondo
- Tarjetas blancas con sombras suaves
- Información clara y organizada
- Badges destacados para el producto más vendido
- Controles intuitivos para ventas

## Licencia

Este proyecto es de código abierto.

// Clase para manejar productos
class Product {
    constructor(name, totalCost, quantity, profitMargin) {
        this.id = Date.now();
        this.name = name;
        this.totalCost = parseFloat(totalCost);
        this.quantity = parseInt(quantity);
        this.profitMargin = parseFloat(profitMargin);
        this.unitCost = this.totalCost / this.quantity;
        this.sellingPrice = this.unitCost * (1 + this.profitMargin / 100);
        this.sold = 0;
        this.remaining = this.quantity;
    }

    sell(amount) {
        const soldAmount = Math.min(amount, this.remaining);
        this.sold += soldAmount;
        this.remaining -= soldAmount;
        return soldAmount;
    }

    getTotalRevenue() {
        return this.sold * this.sellingPrice;
    }

    getTotalProfit() {
        return this.sold * (this.sellingPrice - this.unitCost);
    }
}

// Clase para manejar el inventario
class Inventory {
    constructor() {
        this.products = this.loadFromStorage();
    }

    addProduct(product) {
        this.products.push(product);
        this.saveToStorage();
    }

    removeProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveToStorage();
    }

    getProduct(id) {
        return this.products.find(p => p.id === id);
    }

    sellProduct(id, amount) {
        const product = this.getProduct(id);
        if (product) {
            product.sell(amount);
            this.saveToStorage();
        }
    }

    getBestSeller() {
        if (this.products.length === 0) return null;
        return this.products.reduce((best, current) => 
            current.sold > best.sold ? current : best
        );
    }

    getTotalRevenue() {
        return this.products.reduce((sum, p) => sum + p.getTotalRevenue(), 0);
    }

    getTotalProfit() {
        return this.products.reduce((sum, p) => sum + p.getTotalProfit(), 0);
    }

    getTotalSold() {
        return this.products.reduce((sum, p) => sum + p.sold, 0);
    }

    saveToStorage() {
        localStorage.setItem('inventory', JSON.stringify(this.products));
    }

    loadFromStorage() {
        const data = localStorage.getItem('inventory');
        if (!data) return [];
        
        return JSON.parse(data).map(p => {
            const product = new Product(p.name, p.totalCost, p.quantity, p.profitMargin);
            product.id = p.id;
            product.sold = p.sold;
            product.remaining = p.remaining;
            return product;
        });
    }
}

// Inicializar inventario
const inventory = new Inventory();

// Elementos del DOM
const productForm = document.getElementById('productForm');
const productsList = document.getElementById('productsList');
const statistics = document.getElementById('statistics');

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Renderizar lista de productos
function renderProducts() {
    const bestSeller = inventory.getBestSeller();
    
    if (inventory.products.length === 0) {
        productsList.innerHTML = '<div class="empty-state">No hay productos agregados. Agrega tu primer producto arriba.</div>';
        return;
    }

    productsList.innerHTML = inventory.products.map(product => {
        const isBestSeller = bestSeller && product.id === bestSeller.id && product.sold > 0;
        return `
            <div class="product-item ${isBestSeller ? 'best-seller' : ''}">
                <div class="product-header">
                    <span class="product-name">
                        ${product.name}
                        ${isBestSeller ? '<span class="best-seller-badge">🏆 Más Vendido</span>' : ''}
                    </span>
                </div>
                
                <div class="product-details">
                    <div class="detail-item">
                        <div class="detail-label">Costo por Unidad</div>
                        <div class="detail-value">${formatCurrency(product.unitCost)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Precio de Venta</div>
                        <div class="detail-value">${formatCurrency(product.sellingPrice)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Ganancia por Unidad</div>
                        <div class="detail-value">${formatCurrency(product.sellingPrice - product.unitCost)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Cantidad Total</div>
                        <div class="detail-value">${product.quantity}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Vendidos</div>
                        <div class="detail-value">${product.sold}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Restantes</div>
                        <div class="detail-value">${product.remaining}</div>
                    </div>
                </div>

                <div class="product-actions">
                    <div class="sales-control">
                        <input type="number" id="sellAmount-${product.id}" min="1" max="${product.remaining}" value="1" ${product.remaining === 0 ? 'disabled' : ''}>
                        <button class="btn btn-success" onclick="sellProduct(${product.id})" ${product.remaining === 0 ? 'disabled' : ''}>
                            Vender
                        </button>
                    </div>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar estadísticas
function renderStatistics() {
    const totalRevenue = inventory.getTotalRevenue();
    const totalProfit = inventory.getTotalProfit();
    const totalSold = inventory.getTotalSold();
    const bestSeller = inventory.getBestSeller();

    statistics.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Vendido</div>
                <div class="stat-value">${totalSold}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ingresos Totales</div>
                <div class="stat-value">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ganancia Total</div>
                <div class="stat-value">${formatCurrency(totalProfit)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Producto Estrella</div>
                <div class="stat-value">${bestSeller ? bestSeller.name : 'N/A'}</div>
            </div>
        </div>
    `;
}

// Agregar producto
productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const totalCost = document.getElementById('totalCost').value;
    const quantity = document.getElementById('quantity').value;
    const profitMargin = document.getElementById('profitMargin').value;

    const product = new Product(name, totalCost, quantity, profitMargin);
    inventory.addProduct(product);

    productForm.reset();
    document.getElementById('profitMargin').value = '20'; // Reset to default
    
    renderProducts();
    renderStatistics();
});

// Vender producto
function sellProduct(id) {
    const input = document.getElementById(`sellAmount-${id}`);
    const amount = parseInt(input.value) || 0;
    
    if (amount > 0) {
        inventory.sellProduct(id, amount);
        renderProducts();
        renderStatistics();
    }
}

// Eliminar producto
function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        inventory.removeProduct(id);
        renderProducts();
        renderStatistics();
    }
}

// Renderizar inicialmente
renderProducts();
renderStatistics();

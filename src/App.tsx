import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore'
import './App.css'

interface Product {
  id: string
  name: string
  totalPrice: number
  quantity: number
  quantitySold: number
  unitPrice: number
  unitSalePrice?: number
  desiredProfitPercentage?: number
  profit?: number
  profitPercentage?: number
  totalProfit?: number
  createdAt: number
}

function App() {
  const [productName, setProductName] = useState<string>('')
  const [totalPrice, setTotalPrice] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [unitPrice, setUnitPrice] = useState<number | null>(null)
  const [desiredProfitPercentage, setDesiredProfitPercentage] = useState<string>('')
  const [unitSalePrice, setUnitSalePrice] = useState<string>('')
  const [profit, setProfit] = useState<number | null>(null)
  const [profitPercentage, setProfitPercentage] = useState<number | null>(null)
  const [totalProfit, setTotalProfit] = useState<number | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [unitsSold, setUnitsSold] = useState<{ [key: string]: string }>({})

  // Cargar productos de Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
        const querySnapshot = await getDocs(q)
        const loadedProducts: Product[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data() as any
          loadedProducts.push({
            id: doc.id,
            quantitySold: data.quantitySold || 0,
            ...data
          } as Product)
        })
        setProducts(loadedProducts)
      } catch (error) {
        console.error('Error al cargar productos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const calculateUnitPrice = () => {
    const total = parseFloat(totalPrice)
    const qty = parseFloat(quantity)

    if (isNaN(total) || isNaN(qty) || qty <= 0) {
      setUnitPrice(null)
      return
    }

    setUnitPrice(total / qty)
  }

  const calculateProfit = () => {
    if (unitPrice === null || !unitSalePrice) {
      setProfit(null)
      setProfitPercentage(null)
      setTotalProfit(null)
      return
    }

    const salePrice = parseFloat(unitSalePrice)
    if (isNaN(salePrice)) {
      setProfit(null)
      setProfitPercentage(null)
      setTotalProfit(null)
      return
    }

    const profitPerUnit = salePrice - unitPrice
    const percentage = ((profitPerUnit / unitPrice) * 100)
    const qty = parseInt(quantity)
    const totalProfitCalculated = profitPerUnit * qty

    setProfit(profitPerUnit)
    setProfitPercentage(percentage)
    setTotalProfit(totalProfitCalculated)
  }

  // Análisis: Productos más vendidos
  const getTopSellingProducts = () => {
    return products
      .filter(p => p.quantitySold > 0)
      .sort((a, b) => (b.quantitySold || 0) - (a.quantitySold || 0))
      .slice(0, 5)
  }

  // Análisis: Productos con mayor ganancia potencial
  const getHighestProfitProducts = () => {
    return products
      .filter(p => p.profit && p.profit > 0)
      .sort((a, b) => {
        const profitA = ((a.profit || 0) * a.quantity) || 0
        const profitB = ((b.profit || 0) * b.quantity) || 0
        return profitB - profitA
      })
      .slice(0, 5)
  }

  // Análisis: Productos con mejor margen de ganancia
  const getBestMarginProducts = () => {
    return products
      .filter(p => p.profitPercentage && p.profitPercentage > 0)
      .sort((a, b) => (b.profitPercentage || 0) - (a.profitPercentage || 0))
      .slice(0, 5)
  }

  // Calcular recuperación de inversión por producto
  const calculateRecoveryStatus = (product: Product) => {
    const totalCost = product.totalPrice
    const totalRevenue = (product.unitSalePrice || product.unitPrice) * (product.quantitySold || 0)
    const isRecovered = totalRevenue >= totalCost
    const percentageRecovered = (totalRevenue / totalCost) * 100
    const amountNeeded = isRecovered ? 0 : totalCost - totalRevenue
    
    return {
      isRecovered,
      percentageRecovered,
      amountNeeded,
      totalRevenue,
      totalCost
    }
  }

  // Resumen general de recuperación
  const getRecoverySummary = () => {
    let totalInvested = 0
    let totalRecovered = 0
    let productsRecovered = 0
    let productsNotRecovered = 0

    products.forEach(product => {
      const recovery = calculateRecoveryStatus(product)
      totalInvested += recovery.totalCost
      totalRecovered += recovery.totalRevenue
      if (recovery.isRecovered) productsRecovered++
      else productsNotRecovered++
    })

    return {
      totalInvested,
      totalRecovered,
      productsRecovered,
      productsNotRecovered,
      overallRecoveryPercentage: totalInvested > 0 ? (totalRecovered / totalInvested) * 100 : 0,
      isFullyRecovered: totalRecovered >= totalInvested,
      amountStillNeeded: totalRecovered >= totalInvested ? 0 : totalInvested - totalRecovered
    }
  }

  const saveProduct = async () => {
    // Validar que los campos básicos estén completos
    if (!productName.trim()) {
      alert('❌ Por favor, ingresa el nombre del producto')
      return
    }
    if (!totalPrice || parseFloat(totalPrice) <= 0) {
      alert('❌ Por favor, ingresa un precio total válido')
      return
    }
    if (!quantity || parseInt(quantity) <= 0) {
      alert('❌ Por favor, ingresa una cantidad válida')
      return
    }
    if (unitPrice === null) {
      alert('❌ Por favor, calcula el precio unitario primero')
      return
    }

    // Si no tiene precio de venta, usar el mismo precio unitario
    let salePrice = unitPrice
    if (unitSalePrice && unitSalePrice.trim() !== '') {
      const parsedSalePrice = parseFloat(unitSalePrice)
      if (isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
        alert('❌ El precio de venta debe ser un número válido mayor a 0')
        return
      }
      salePrice = parsedSalePrice
    }

    // Calcular ganancia si no está calculada
    let finalProfit = profit !== null ? profit : (salePrice - unitPrice)
    let finalProfitPercentage = profitPercentage !== null ? profitPercentage : ((finalProfit / unitPrice) * 100)
    let finalTotalProfit = totalProfit !== null ? totalProfit : (finalProfit * parseInt(quantity))

    try {
      const qty = parseInt(quantity)
      const newProduct = {
        name: productName,
        totalPrice: parseFloat(totalPrice),
        quantity: qty,
        quantitySold: 0,
        unitPrice: unitPrice,
        unitSalePrice: salePrice,
        desiredProfitPercentage: desiredProfitPercentage ? parseFloat(desiredProfitPercentage) : finalProfitPercentage,
        profit: finalProfit,
        profitPercentage: finalProfitPercentage,
        totalProfit: finalTotalProfit,
        createdAt: Date.now()
      }

      console.log('📝 Guardando producto:', newProduct)
      const docRef = await addDoc(collection(db, 'products'), newProduct)
      console.log('✅ Producto guardado con ID:', docRef.id)

      // Agregar a la lista local inmediatamente
      setProducts([
        {
          id: docRef.id,
          ...newProduct
        },
        ...products
      ])

      // Limpiar formulario
      setProductName('')
      setTotalPrice('')
      setQuantity('')
      setUnitPrice(null)
      setDesiredProfitPercentage('')
      setUnitSalePrice('')
      setProfit(null)
      setProfitPercentage(null)
      setTotalProfit(null)

      alert('✅ ¡Producto guardado exitosamente!')
    } catch (error) {
      console.error('❌ Error al guardar producto:', error)
      alert('❌ Error al guardar el producto: ' + (error as any).message)
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId))
      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar el producto')
    }
  }

  const recordSale = async (productId: string) => {
    const sold = parseInt(unitsSold[productId] || '0')
    if (sold <= 0) {
      alert('Ingresa la cantidad de unidades vendidas')
      return
    }

    const product = products.find(p => p.id === productId)
    if (!product) return

    const remainingQuantity = (product.quantitySold || 0) + sold
    if (remainingQuantity > product.quantity) {
      alert(`No puedes vender más de ${product.quantity} unidades. Ya se han vendido ${product.quantitySold || 0}.`)
      return
    }

    try {
      const productRef = doc(db, 'products', productId)
      await updateDoc(productRef, {
        quantitySold: remainingQuantity
      })

      // Actualizar estado local
      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, quantitySold: remainingQuantity }
          : p
      ))

      setUnitsSold({ ...unitsSold, [productId]: '' })
      alert('¡Venta registrada exitosamente!')
    } catch (error) {
      console.error('Error al registrar venta:', error)
      alert('Error al registrar la venta')
    }
  }

  const calculateRemainingProfit = (product: Product) => {
    if (!product.profit) return 0
    const remaining = product.quantity - (product.quantitySold || 0)
    return (product.profit || 0) * remaining
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculateProfit()
    }
  }

  return (
    <div className="app-container">
      <div className="calculator-container">
        <h1>💰 Calculadora de Ganancias</h1>
        
        <div className="form-group">
          <label htmlFor="productName">Nombre del Producto:</label>
          <input
            id="productName"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ej: Manzanas"
          />
        </div>

        <div className="section-title">Precio de Compra</div>

        <div className="form-group">
          <label htmlFor="totalPrice">Precio Total de Compra:</label>
          <div className="input-group">
            <span className="currency">$</span>
            <input
              id="totalPrice"
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: 150.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Cantidad de Unidades:</label>
          <input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ej: 6"
            step="1"
            min="1"
          />
        </div>

        <button onClick={calculateUnitPrice} className="calculate-btn">
          Calcular Precio Unitario
        </button>

        {unitPrice !== null && (
          <div className="result unit-price-result">
            <p className="result-label">Precio Unitario de Compra:</p>
            <p className="result-value">${unitPrice.toFixed(2)}</p>
          </div>
        )}

        {unitPrice !== null && (
          <>
            <div className="form-group">
              <label htmlFor="unitSalePrice">Precio Unitario de Venta:</label>
              <div className="input-group">
                <span className="currency">$</span>
                <input
                  id="unitSalePrice"
                  type="number"
                  value={unitSalePrice}
                  onChange={(e) => setUnitSalePrice(e.target.value)}
                  placeholder="Ej: 30.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <button onClick={calculateProfit} className="calculate-btn profit-btn">
              Calcular Ganancia
            </button>

            {profit !== null && (
              <div className={`result profit-result ${profit >= 0 ? 'positive' : 'negative'}`}>
                <div className="profit-results-group">
                  <div className="result-item">
                    <span className="result-item-label">Precio Unitario:</span>
                    <span className="result-item-value">${unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="result-item profit-unit">
                    <span className="result-item-label">Ganancia Unitaria:</span>
                    <span className={`result-item-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                      ${profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="result-item profit-total">
                    <span className="result-item-label">Ganancia Total:</span>
                    <span className={`result-item-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                      ${totalProfit?.toFixed(2)}
                    </span>
                  </div>
                  {profitPercentage !== null && (
                    <div className="result-item">
                      <span className="result-item-label">Porcentaje:</span>
                      <span className="result-item-value">{profitPercentage.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
                <button onClick={saveProduct} className="save-btn">
                  💾 Guardar Producto
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lista de productos guardados */}
      <div className="products-container">
        <h2>📦 Productos Guardados</h2>
        
        {/* Resumen de ganancias totales */}
        {products.length > 0 && (
          <div className="recovery-summary">
            {(() => {
              const recovery = getRecoverySummary()
              return (
                <>
                  <div className={`recovery-status ${recovery.isFullyRecovered ? 'recovered' : 'not-recovered'}`}>
                    <h3>{recovery.isFullyRecovered ? '✅ INVERSIÓN RECUPERADA' : '⚠️ RECUPERANDO INVERSIÓN'}</h3>
                    <div className="recovery-details">
                      <div className="detail">
                        <span className="label">Invertido:</span>
                        <span className="value">${recovery.totalInvested.toFixed(2)}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Recuperado:</span>
                        <span className="value">${recovery.totalRecovered.toFixed(2)}</span>
                      </div>
                      {!recovery.isFullyRecovered && (
                        <div className="detail needed">
                          <span className="label">Falta:</span>
                          <span className="value">${recovery.amountStillNeeded.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="detail">
                        <span className="label">Avance:</span>
                        <span className="value">{recovery.overallRecoveryPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${Math.min(recovery.overallRecoveryPercentage, 100)}%`}}
                      ></div>
                    </div>
                  </div>

                  <div className="profit-summary">
                    <p className="summary-label">💰 Ganancia Neta Total:</p>
                    <p className={`summary-value ${recovery.totalRecovered - recovery.totalInvested >= 0 ? 'positive' : 'negative'}`}>
                      ${(recovery.totalRecovered - recovery.totalInvested).toFixed(2)}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Sección de Análisis */}
        {products.length > 0 && (
          <div className="analytics-section">
            <h3>📊 Análisis de Ventas</h3>
            
            {/* Productos más vendidos */}
            {getTopSellingProducts().length > 0 && (
              <div className="analytics-card top-sellers">
                <h4>🏆 Productos Más Vendidos</h4>
                <div className="analytics-list">
                  {getTopSellingProducts().map((product) => (
                    <div key={product.id} className="analytics-item">
                      <div className="analytics-product-name">{product.name}</div>
                      <div className="analytics-metric">
                        <span className="metric-label">Vendidas:</span>
                        <span className="metric-value sold">{product.quantitySold} unidades</span>
                      </div>
                      <div className="analytics-metric">
                        <span className="metric-label">Ganancia:</span>
                        <span className="metric-value">${((product.profit || 0) * product.quantitySold).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productos con mayor ganancia total */}
            {getHighestProfitProducts().length > 0 && (
              <div className="analytics-card highest-profit">
                <h4>💰 Mayor Ganancia Potencial</h4>
                <div className="analytics-list">
                  {getHighestProfitProducts().map((product) => (
                    <div key={product.id} className="analytics-item">
                      <div className="analytics-product-name">{product.name}</div>
                      <div className="analytics-metric">
                        <span className="metric-label">Ganancia Total:</span>
                        <span className="metric-value profit">${((product.profit || 0) * product.quantity).toFixed(2)}</span>
                      </div>
                      <div className="analytics-metric">
                        <span className="metric-label">Margen:</span>
                        <span className="metric-value">{product.profitPercentage?.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productos con mejor margen */}
            {getBestMarginProducts().length > 0 && (
              <div className="analytics-card best-margin">
                <h4>📈 Mejor Margen de Ganancia</h4>
                <div className="analytics-list">
                  {getBestMarginProducts().map((product) => (
                    <div key={product.id} className="analytics-item">
                      <div className="analytics-product-name">{product.name}</div>
                      <div className="analytics-metric">
                        <span className="metric-label">Margen:</span>
                        <span className="metric-value margin">{product.profitPercentage?.toFixed(2)}%</span>
                      </div>
                      <div className="analytics-metric">
                        <span className="metric-label">Precio Venta:</span>
                        <span className="metric-value">${product.unitSalePrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="loading">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="no-products">No hay productos guardados aún</p>
        ) : (
          <div className="products-list">
            {products.map((product) => (
              <div key={product.id} className={`product-card ${product.profit && product.profit >= 0 ? 'profit-positive-card' : 'profit-negative-card'}`}>
                <div className="product-info">
                  <h3>{product.name}</h3>

                  {/* Estado de Recuperación de Inversión */}
                  {(() => {
                    const recovery = calculateRecoveryStatus(product)
                    return (
                      <div className={`recovery-badge ${recovery.isRecovered ? 'recovered' : 'not-recovered'}`}>
                        <span className="badge-label">
                          {recovery.isRecovered ? '✅ RECUPERADO' : '⚠️ RECUPERANDO'}
                        </span>
                        <span className="badge-percentage">{recovery.percentageRecovered.toFixed(1)}%</span>
                      </div>
                    )
                  })()}
                  
                  {/* Información de Inventario */}
                  <div className="inventory-section">
                    <span className="section-label">Inventario:</span>
                    <p>
                      <span className="label">Total Comprado:</span> 
                      <strong>{product.quantity} unidades</strong>
                    </p>
                    <p>
                      <span className="label">Vendidas:</span> 
                      <strong className="sold-count">{product.quantitySold || 0}</strong>
                    </p>
                    <p>
                      <span className="label">Disponibles:</span> 
                      <strong className="available-count">{product.quantity - (product.quantitySold || 0)}</strong>
                    </p>
                  </div>

                  <div className="product-details">
                    <div className="detail-section">
                      <span className="section-label">Compra:</span>
                      <p><span className="label">Precio Total:</span> ${product.totalPrice.toFixed(2)}</p>
                      <p><span className="label">Cantidad:</span> {product.quantity} unidades</p>
                      <p><span className="label">Precio Unitario:</span> ${product.unitPrice.toFixed(2)}</p>
                    </div>
                    {product.unitSalePrice && (
                      <div className="detail-section">
                        <span className="section-label">Venta:</span>
                        <p><span className="label">Precio Unitario:</span> ${product.unitSalePrice.toFixed(2)}</p>
                        {product.profit !== undefined && (
                          <>
                            <p className={`profit-line ${product.profit >= 0 ? 'positive' : 'negative'}`}>
                              <span className="label">Ganancia Unitaria:</span> 
                              <strong>${product.profit.toFixed(2)}</strong>
                            </p>
                            {product.totalProfit !== undefined && (
                              <p className={`profit-line ${product.profit >= 0 ? 'positive' : 'negative'}`}>
                                <span className="label">Ganancia Total:</span> 
                                <strong>${product.totalProfit.toFixed(2)}</strong>
                              </p>
                            )}
                            {product.profitPercentage !== undefined && (
                              <p className={`profit-percentage ${product.profit >= 0 ? 'positive' : 'negative'}`}>
                                <span className="label">Porcentaje:</span> 
                                <strong>{product.profitPercentage.toFixed(2)}%</strong>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Ganancia Restante */}
                    {product.profit !== undefined && (product.quantitySold || 0) > 0 && (
                      <div className="detail-section remaining-profit">
                        <span className="section-label">Ganancia Restante:</span>
                        <p className={`remaining-profit-value ${calculateRemainingProfit(product) >= 0 ? 'positive' : 'negative'}`}>
                          ${calculateRemainingProfit(product).toFixed(2)}
                        </p>
                        <p className="remaining-units">
                          {product.quantity - (product.quantitySold || 0)} unidades sin vender
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Control de Ventas */}
                  <div className="sales-control">
                    <label htmlFor={`units-${product.id}`}>Unidades Vendidas:</label>
                    <div className="sales-input-group">
                      <input
                        id={`units-${product.id}`}
                        type="number"
                        min="1"
                        max={product.quantity - (product.quantitySold || 0)}
                        value={unitsSold[product.id] || ''}
                        onChange={(e) => setUnitsSold({ ...unitsSold, [product.id]: e.target.value })}
                        placeholder="Ingresa cantidad"
                      />
                      <button 
                        onClick={() => recordSale(product.id)}
                        className="record-sale-btn"
                      >
                        Registrar Venta
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="delete-btn"
                  title="Eliminar producto"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App

import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, where } from 'firebase/firestore'
import { ShareButton } from './components/ShareButton'
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
  userId: string
  // Ventas por día (lunes=0, domingo=6)
  dailySales?: {
    monday: number
    tuesday: number
    wednesday: number
    thursday: number
    friday: number
    saturday: number
    sunday: number
  }
}

interface User {
  userId: string
  username: string
}

function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authUsername, setAuthUsername] = useState<string>('')
  const [authPassword, setAuthPassword] = useState<string>('')
  const [authError, setAuthError] = useState<string>('')

  // Product state
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedDay, setSelectedDay] = useState<string>('monday')
  const [calculatorExpanded, setCalculatorExpanded] = useState(true)
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true)

  // Cargar sesión del localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        console.log('🔐 Sesión cargada de localStorage:', parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('user')
      }
    } else {
      console.log('⚠️ No hay sesión guardada en localStorage')
    }
  }, [])

  // Cargar productos de Firebase (solo si hay usuario)
  useEffect(() => {
    if (!user) {
      console.log('⚠️ No hay usuario, no se cargan productos')
      setProducts([])
      return
    }
    
    const loadProducts = async () => {
      try {
        setLoading(true)
        console.log('📦 Iniciando carga de productos para usuario:', user.userId, 'username:', user.username)
        
        // Primero: intentar con query filtrada por userId
        try {
          const q = query(
            collection(db, 'products'),
            where('userId', '==', user.userId),
            orderBy('createdAt', 'desc')
          )
          console.log('📦 Query CON FILTRO creada, ejecutando getDocs...')
          
          const querySnapshot = await getDocs(q)
          console.log('✅ Query completada. Documentos encontrados:', querySnapshot.size)
          
          const loadedProducts: Product[] = []
          querySnapshot.forEach((doc) => {
            const data = doc.data() as any
            console.log('  ✓ Documento:', doc.id, 'name:', data.name, 'userId:', data.userId)
            loadedProducts.push({
              id: doc.id,
              quantitySold: data.quantitySold || 0,
              ...data
            } as Product)
          })
          console.log('✅ Total productos cargados:', loadedProducts.length)
          setProducts(loadedProducts)
        } catch (filterError: any) {
          console.warn('⚠️ Error con query filtrada:', filterError.message)
          console.log('📦 Intentando carga SIN FILTRO...')
          
          // Fallback: cargar todos sin filtro y filtrar en cliente
          const allDocsSnapshot = await getDocs(
            query(collection(db, 'products'), orderBy('createdAt', 'desc'))
          )
          console.log('📦 Total documentos sin filtro:', allDocsSnapshot.size)
          
          const loadedProducts: Product[] = []
          allDocsSnapshot.forEach((doc) => {
            const data = doc.data() as any
            if (data.userId === user.userId) {
              console.log('  ✓ Documento coincidente:', doc.id, 'name:', data.name)
              loadedProducts.push({
                id: doc.id,
                quantitySold: data.quantitySold || 0,
                ...data
              } as Product)
            }
          })
          console.log('✅ Total productos cargados (filtrado en cliente):', loadedProducts.length)
          setProducts(loadedProducts)
        }
      } catch (error: any) {
        console.error('❌ ERROR crítico al cargar productos:', error)
        console.error('   Código:', error.code)
        console.error('   Mensaje:', error.message)
        alert('Error al cargar productos: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [user])

  // Autenticación (simple: basada en localStorage)
  const handleLogin = async () => {
    setAuthError('')
    
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('Usuario y contraseña requeridos')
      return
    }

    try {
      // Buscar usuario en Firestore
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', authUsername.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setAuthError('Usuario o contraseña incorrectos')
        return
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()

      // Validar contraseña (en producción: usar hash)
      if (userData.password !== authPassword) {
        setAuthError('Usuario o contraseña incorrectos')
        return
      }

      // Guardar sesión
      const currentUser: User = {
        userId: userDoc.id,
        username: userData.username
      }
      console.log('✅ Login exitoso para usuario:', currentUser.userId)
      localStorage.setItem('user', JSON.stringify(currentUser))
      setUser(currentUser)
      setAuthUsername('')
      setAuthPassword('')
    } catch (error) {
      setAuthError('Error al iniciar sesión')
      console.error('Login error:', error)
    }
  }

  const handleRegister = async () => {
    setAuthError('')
    
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('Usuario y contraseña requeridos')
      return
    }

    if (authPassword.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      // Verificar si el usuario ya existe
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', authUsername.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        setAuthError('El usuario ya existe')
        return
      }

      // Crear nuevo usuario
      const newUserRef = await addDoc(usersRef, {
        username: authUsername.toLowerCase(),
        password: authPassword, // En producción: usar hash bcrypt
        createdAt: Date.now()
      })

      // Guardar sesión
      const currentUser: User = {
        userId: newUserRef.id,
        username: authUsername
      }
      setUser(currentUser)
      localStorage.setItem('user', JSON.stringify(currentUser))
      setAuthUsername('')
      setAuthPassword('')
    } catch (error) {
      setAuthError('Error al crear usuario')
      console.error(error)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    setProducts([])
    setAuthUsername('')
    setAuthPassword('')
    setAuthError('')
  }

  // Función helper para validar que no haya números negativos
  const validateNonNegative = (value: string): string => {
    const num = parseFloat(value)
    if (num < 0 || (value && isNaN(num))) {
      return '0'
    }
    return value
  }

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
    if (!user) {
      alert('❌ Debes iniciar sesión primero')
      return
    }
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
        createdAt: Date.now(),
        userId: user.userId
      }

      console.log('📝 Guardando producto con userId:', user.userId, newProduct)
      const docRef = await addDoc(collection(db, 'products'), newProduct)
      console.log('✅ Producto guardado con ID:', docRef.id, 'para usuario:', user.userId)

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
      // Inicializar dailySales si no existe
      const currentDailySales = product.dailySales || {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      }

      // Actualizar ventas del día seleccionado
      const updatedDailySales = {
        ...currentDailySales,
        [selectedDay]: (currentDailySales[selectedDay as keyof typeof currentDailySales] || 0) + sold
      }

      const productRef = doc(db, 'products', productId)
      await updateDoc(productRef, {
        quantitySold: remainingQuantity,
        dailySales: updatedDailySales
      })

      // Actualizar estado local
      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, quantitySold: remainingQuantity, dailySales: updatedDailySales }
          : p
      ))

      setUnitsSold({ ...unitsSold, [productId]: '' })
      alert(`¡${sold} unidades vendidas el ${selectedDay}!`)
    } catch (error) {
      console.error('Error al registrar venta:', error)
      alert('Error al registrar la venta')
    }
  }

  // Función para obtener resumen semanal de un producto
  const getWeeklySummary = (product: Product) => {
    const daily = product.dailySales || {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    }
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const totalWeekly = Object.values(daily).reduce((sum, val) => sum + val, 0)
    const maxDay = Math.max(...Object.values(daily))
    const bestDay = days[Object.values(daily).indexOf(maxDay)]
    
    return { daily, days, dayNames, totalWeekly, bestDay, maxDay }
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

  // Si no hay usuario, mostrar login/registro
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>🔐 Acceso</h1>
          
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError('') }}
            >
              Iniciar Sesión
            </button>
            <button 
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError('') }}
            >
              Crear Cuenta
            </button>
          </div>

          <div className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Usuario:</label>
              <input
                id="username"
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Tu usuario"
                onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                id="password"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Tu contraseña"
                onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())}
              />
            </div>

            {authError && <div className="auth-error">{authError}</div>}

            <button 
              className="auth-submit-btn"
              onClick={authMode === 'login' ? handleLogin : handleRegister}
            >
              {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="logout-btn-container">
        <span className="user-display">👤 {user.username}</span>
        <div className="button-group">
          <ShareButton appTitle="App-Cell" />
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </div>
      
      <div className="calculator-container">
        <button 
          className="calculator-title-btn"
          onClick={() => setCalculatorExpanded(!calculatorExpanded)}
          title="Click para expandir/colapsar"
        >
          <h1>📦 Calculadora de Productos {calculatorExpanded ? '▼' : '▶'}</h1>
        </button>
        
        {calculatorExpanded && (
          <div className="calculator-content">
            <label htmlFor="productName">Nombre del Producto:</label>
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Collares"
            />

            <div className="section-title">Precio de Compra</div>

            <div className="form-group">
              <label htmlFor="totalPrice">Precio Total de Compra:</label>
              <div className="input-group">
                <span className="currency">$</span>
                <input
                  id="totalPrice"
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(validateNonNegative(e.target.value))}
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
                onChange={(e) => setQuantity(validateNonNegative(e.target.value))}
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
                      onChange={(e) => setUnitSalePrice(validateNonNegative(e.target.value))}
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
            <button 
              className="analytics-title-btn"
              onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
              title="Click para expandir/colapsar"
            >
              <h3>📊 Análisis de Ventas {analyticsExpanded ? '▼' : '▶'}</h3>
            </button>
            
            {analyticsExpanded && (
            <div className="analytics-content">
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
          </div>
        )}

        {loading ? (
          <p className="loading">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="no-products">No hay productos guardados aún</p>
        ) : (
          <div className="products-list">
            {products.map((product) => {
              const isExpanded = expandedIds.has(product.id)
              return (
                <div
                  key={product.id}
                  className={`product-card ${product.profit && product.profit >= 0 ? 'profit-positive-card' : 'profit-negative-card'}`}
                  onClick={() => {
                    const newSet = new Set(expandedIds)
                    if (newSet.has(product.id)) newSet.delete(product.id)
                    else newSet.add(product.id)
                    setExpandedIds(newSet)
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {!isExpanded ? (
                    <div className="product-compact">
                      <div className="compact-left">
                        <h3>{product.name}</h3>
                        <div className="compact-sold">Vendidas: <strong className="sold-count">{product.quantitySold || 0}</strong></div>
                        <div className="sales-control-compact" onClick={(e) => e.stopPropagation()}>
                          <div className="day-buttons-grid">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                              const dayLabels: Record<string, string> = { monday: 'L', tuesday: 'M', wednesday: 'X', thursday: 'J', friday: 'V', saturday: 'S', sunday: 'D' }
                              return (
                                <button
                                  key={day}
                                  onClick={(e) => { e.stopPropagation(); setSelectedDay(day) }}
                                  className={`day-button ${selectedDay === day ? 'active' : ''}`}
                                  title={day.charAt(0).toUpperCase() + day.slice(1)}
                                >
                                  {dayLabels[day]}
                                </button>
                              )
                            })}
                          </div>
                          <div className="sales-input-group">
                            <input
                              id={`units-${product.id}`}
                              type="number"
                              min="1"
                              max={product.quantity - (product.quantitySold || 0)}
                              value={unitsSold[product.id] || ''}
                              onChange={(e) => setUnitsSold({ ...unitsSold, [product.id]: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              placeholder="Ingresa cantidad"
                            />
                            <button 
                              onClick={(e) => { e.stopPropagation(); recordSale(product.id) }}
                              className="record-sale-btn"
                            >
                              Registrar Venta
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="compact-actions">
                        <button onClick={(e) => { e.stopPropagation(); deleteProduct(product.id) }} className="delete-btn" title="Eliminar producto">🗑️</button>
                      </div>
                    </div>
                  ) : (
                    <>
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

                        {/* Análisis Semanal */}
                        {(() => {
                          const summary = getWeeklySummary(product)
                          return (
                            <div className="weekly-analysis">
                              <span className="section-label">📊 Análisis Semanal:</span>
                              <div className="weekly-grid">
                                {summary.dayNames.map((dayName, idx) => {
                                  const dayKey = summary.days[idx] as keyof typeof summary.daily
                                  const sales = summary.daily[dayKey] || 0
                                  return (
                                    <div key={idx} className={`weekly-day ${sales > 0 ? 'has-sales' : ''}`}>
                                      <div className="day-name">{dayName.substring(0, 3)}</div>
                                      <div className="day-sales">{sales}</div>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="weekly-summary">
                                <p><span className="label">Total Semana:</span> <strong>{summary.totalWeekly}</strong> unidades</p>
                                <p><span className="label">Mejor Día:</span> <strong>{summary.bestDay}</strong> ({summary.maxDay} unidades)</p>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Control de Ventas */}
                        <div className="sales-control" onClick={(e) => e.stopPropagation()}>
                          <label>Registrar Venta del Día:</label>
                          <div className="day-buttons-grid-expanded">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                              const dayLabels: Record<string, string> = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' }
                              return (
                                <button
                                  key={day}
                                  onClick={(e) => { e.stopPropagation(); setSelectedDay(day) }}
                                  className={`day-button-expanded ${selectedDay === day ? 'active' : ''}`}
                                >
                                  {dayLabels[day]}
                                </button>
                              )
                            })}
                          </div>
                          <div className="sales-input-group">
                              <input
                                id={`units-exp-${product.id}`}
                                type="number"
                                min="1"
                                max={product.quantity - (product.quantitySold || 0)}
                                value={unitsSold[product.id] || ''}
                                onChange={(e) => setUnitsSold({ ...unitsSold, [product.id]: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="Ingresa cantidad"
                              />
                              <button 
                                onClick={(e) => { e.stopPropagation(); recordSale(product.id) }}
                                className="record-sale-btn"
                              >
                                Registrar Venta
                              </button>
                            </div>
                          </div>
                        </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProduct(product.id) }}
                        className="delete-btn"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* fin productos */}
    </div>
  )
}

export default App

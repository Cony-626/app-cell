import { useState } from 'react'
import './App.css'

function App() {
  const [totalPrice, setTotalPrice] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [unitPrice, setUnitPrice] = useState<number | null>(null)

  const calculateUnitPrice = () => {
    const total = parseFloat(totalPrice)
    const qty = parseFloat(quantity)

    if (isNaN(total) || isNaN(qty) || qty <= 0) {
      setUnitPrice(null)
      return
    }

    setUnitPrice(total / qty)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculateUnitPrice()
    }
  }

  return (
    <div className="calculator-container">
      <h1>💰 Calculadora de Precio Unitario</h1>
      
      <div className="form-group">
        <label htmlFor="totalPrice">Precio Total:</label>
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
        <div className="result">
          <p className="result-label">Precio por Unidad:</p>
          <p className="result-value">${unitPrice.toFixed(2)}</p>
        </div>
      )}
    </div>
  )
}

export default App

import { useState } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loginUser, verifyUser } from '../features/authSlice'
import styles from '../styles'
const Login = () => {
  const [countryCode, setCountryCode] = useState('+91')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()
  const { loading: isLoading, error } = useSelector((state) => state.auth)

  const countryCodes = [
    { code: '+91', country: 'IN (+91)' },
    { code: '+971', country: 'AE (+971)' },
    { code: '+1', country: 'US/CA (+1)' },
    { code: '+44', country: 'UK (+44)' },
    { code: '+61', country: 'AU (+61)' }
  ]

  const isPhoneNumber = (val) => /^\d+$/.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault()

    // If identifier is just digits, prepend the selected country code
    const email = isPhoneNumber(identifier) ? `${countryCode}${identifier}` : identifier;

    const resultAction = await dispatch(loginUser({ email, password }))
    if (loginUser.fulfilled.match(resultAction)) {
      // Refresh user data from /api/user/me to ensure full profile & balance
      dispatch(verifyUser());
    }
  }

  return (
    <div className={styles.authContainer}>
      <form
        className={styles.authCard}
        onSubmit={handleSubmit}
      >
        <h3 className={styles.formHeading}>Log In</h3>

        <div className="space-y-4">
          <div>
            <label className={styles.label}>Email or Phone Number</label>
            <div className={`flex rounded-lg overflow-hidden bg-[#1a1a1a] focus-within:ring-2 focus-within:ring-red-500/50 transition-all border ${error ? 'border-red-500' : 'border-[#333333] focus-within:border-red-500'}`}>
              {isPhoneNumber(identifier) && identifier.length > 0 && (
                <select
                  className={`w-[120px] px-3 py-2 bg-transparent text-white border-r outline-none cursor-pointer hover:bg-[#222222] ${error ? 'border-red-500' : 'border-[#333333]'}`}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  {countryCodes.map(({ code, country }) => (
                    <option key={code} value={code} className="bg-[#1a1a1a]">
                      {country}
                    </option>
                  ))}
                </select>
              )}
              <input
                className={`w-full px-4 py-2 bg-transparent text-white outline-none placeholder-gray-600 ${error ? 'text-red-500' : ''}`}
                type="text"
                onChange={(e) => setIdentifier(e.target.value)}
                value={identifier}
                placeholder="Enter email or phone number"
                required
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>Password</label>
            <input
              className={`${styles.inputBase} ${error ? styles.inputError : styles.inputNormal}`}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
          </div>
        </div>

        <button
          className={styles.primaryButton}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>

        {error && (
          <div className={styles.errorContainer}>
            {error}
          </div>
        )}

        <div className="mt-4 text-center text-sm text-slate-300">
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 font-medium ml-1">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Login
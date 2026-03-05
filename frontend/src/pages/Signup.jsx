import { useState } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { signupUser } from '../features/authSlice'
import styles from '../styles'
const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referredByCode, setReferredByCode] = useState('')

  const dispatch = useDispatch()
  const isLoading = useSelector((state) => state.auth.loading)
  const error = useSelector((state) => state.auth.error)

  const handleSubmit = async (e) => {
    e.preventDefault()

    await dispatch(signupUser({
      name,
      email,
      password,
      referred_by_code: referredByCode
    }))
  }

  return (
    <div className={styles.authContainer}>
      <form
        className={styles.authCard}
        onSubmit={handleSubmit}
      >
        <h3 className={styles.formHeading}>Sign Up</h3>

        <div className="space-y-4">
          <div>
            <label className={styles.label}>Name</label>
            <input
              className={`${styles.inputBase} ${error ? styles.inputError : styles.inputNormal}`}
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>

          <div>
            <label className={styles.label}>Email address</label>
            <input
              className={`${styles.inputBase} ${error ? styles.inputError : styles.inputNormal}`}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
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

          <div>
            <label className={styles.label}>Referral Code (Optional)</label>
            <input
              className={`${styles.inputBase} border-slate-300 focus:ring-emerald-500 focus:border-emerald-500`}
              type="text"
              onChange={(e) => setReferredByCode(e.target.value)}
              value={referredByCode}
              placeholder="Enter code if you have one"
            />
          </div>
        </div>

        <button
          className={styles.primaryButton}
          disabled={isLoading}
        >
          {isLoading ? 'Signing up...' : 'Sign up'}
        </button>

        {error && (
          <div className={styles.errorContainer}>
            {error}
          </div>
        )}

        <div className="mt-4 text-center text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-medium ml-1">
            Log in
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Signup
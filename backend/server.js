require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/user')
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express()

app.set('trust proxy', 1);
// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://maxso-org.onrender.com',
    'https://maxso-org.vercel.app',
    'https://amacso.org',
    'https://www.amacso.org'
  ],
  credentials: true
}));

app.options('*', cors());

app.use(express.json())
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(req.path, req.method)
  next()
})

// routes
app.use('/api/user', userRoutes)
app.use('/api/plans', require('./routes/plan'))
app.use('/api/level-configs', require('./routes/levelConfig'))
app.use('/api/transactions', require('./routes/transaction'))
app.use('/api/dashboard', require('./routes/dashboard'))

app.use(errorHandler);

// Initialize Background Jobs
require('./cron/dailyRoiJob').start();
require('./cron/monthlyLevelJob').start();

// listen for requests
app.listen(process.env.PORT, () => {
  console.log('Server listening on port', process.env.PORT)
})
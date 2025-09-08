require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const { connectDb } = require('./utils/db');

const authRoutes = require('./routes/auth.routes');
const { resetPasswordWithToken } = require('./controllers/auth.controller');
const userRoutes = require('./routes/user.routes');
const sellerRoutes = require('./routes/seller.routes');
const productRoutes = require('./routes/product.routes');
const serviceRoutes = require('./routes/service.routes');
const messageRoutes = require('./routes/message.routes');
const reviewRoutes = require('./routes/review.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Swagger UI
try {
  const openapiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
  const openapiDoc = YAML.load(openapiPath);
  app.get('/api/v1/docs.json', (req, res) => res.json(openapiDoc));
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
} catch (e) {
  console.warn('OpenAPI spec not loaded:', e?.message);
}

// API routes (versioned)
app.use('/api/v1/auth', authRoutes);
// also support Reset Password outside /auth to match frontend
app.post('/api/v1/reset-password', resetPasswordWithToken);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sellers', sellerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
connectDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API running on :${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });

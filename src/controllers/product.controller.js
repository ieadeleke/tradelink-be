const multer = require('multer');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage() });
const uploadProductImage = upload.single('productImg');

// GET /api/v1/products
async function listProducts(req, res) {
  const prods = await Product.find({}).sort({ createdAt: -1 });
  // shape expected: { data: [...] }
  return res.json({ data: prods });
}

// POST /api/v1/products
async function createProduct(req, res) {
  try {
    const { name, category, price, quantity, description } = req.body;
    const seller = await Seller.findOne({ userId: req.user._id });
    let productImg;
    if (req.file) {
      const up = await uploadBufferToCloudinary(req.file.buffer, 'tradelink/products', undefined);
      productImg = up.secure_url;
    }
    const prod = await Product.create({
      userId: req.user._id,
      sellerId: seller?._id,
      name,
      category,
      price: Number(price),
      quantity: quantity !== undefined ? Number(quantity) : 0,
      description,
      productImg,
    });
    return res.status(201).json({ message: 'Product created', data: prod });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Failed to create product' });
  }
}

// GET /api/v1/products/seller/:sellerId
async function listBySeller(req, res) {
  const { sellerId } = req.params;
  const products = await Product.find({ sellerId }).sort({ createdAt: -1 });
  // MyListings expects response.data.products
  const withId = products.map(p => ({
    id: String(p._id),
    name: p.name,
    category: p.category,
    price: p.price,
    quantity: p.quantity,
    productImg: p.productImg,
  }));
  return res.json({ products: withId });
}

// DELETE /api/v1/products/:id
async function removeProduct(req, res) {
  const { id } = req.params;
  await Product.deleteOne({ _id: id });
  return res.json({ message: 'Deleted' });
}

module.exports = {
  uploadProductImage,
  listProducts,
  createProduct,
  listBySeller,
  removeProduct,
};


const multer = require('multer');
const Service = require('../models/Service');
const Seller = require('../models/Seller');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage() });
const uploadServiceImage = upload.single('serviceImg');

// GET /api/v1/services/all
async function listAll(req, res) {
  const items = await Service.find({}).sort({ createdAt: -1 });
  return res.json(items);
}

// POST /api/v1/services/create
async function createService(req, res) {
  try {
    const { name, category, price, description } = req.body;
    const seller = await Seller.findOne({ userId: req.user._id });
    let serviceImg;
    if (req.file) {
      const up = await uploadBufferToCloudinary(req.file.buffer, 'tradelink/services', undefined);
      serviceImg = up.secure_url;
    }
    const item = await Service.create({
      userId: req.user._id,
      sellerId: seller?._id,
      name,
      category,
      price: price ? Number(price) : undefined,
      description,
      serviceImg,
      email: seller?.email || req.user.email,
      storeName: seller?.storeName,
    });
    return res.status(201).json({ message: 'Service created', data: item });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Failed to create service' });
  }
}

// GET /api/v1/services/seller/:sellerId
async function listBySeller(req, res) {
  const { sellerId } = req.params;
  const services = await Service.find({ sellerId }).sort({ createdAt: -1 });
  const shaped = services.map(s => ({
    id: String(s._id),
    name: s.name,
    category: s.category,
    price: s.price,
    serviceImg: s.serviceImg,
  }));
  return res.json({ services: shaped });
}

// DELETE /api/v1/services/:id
async function removeService(req, res) {
  const { id } = req.params;
  await Service.deleteOne({ _id: id });
  return res.json({ message: 'Deleted' });
}

module.exports = {
  uploadServiceImage,
  listAll,
  createService,
  listBySeller,
  removeService,
};
// GET /api/v1/services/:id
async function getService(req, res) {
  try {
    const { id } = req.params;
    const svc = await Service.findById(id).populate('sellerId');
    if (!svc) return res.status(404).json({ message: 'Service not found' });
    return res.json({ data: svc });
  } catch (e) {
    return res.status(400).json({ message: 'Invalid service id' });
  }
}

module.exports.getService = getService;

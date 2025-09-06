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
    // Parse optional complex fields
    let servicesOffered;
    if (req.body.servicesOffered) {
      if (Array.isArray(req.body.servicesOffered)) {
        servicesOffered = req.body.servicesOffered;
      } else {
        try {
          const parsed = JSON.parse(req.body.servicesOffered);
          servicesOffered = Array.isArray(parsed) ? parsed : String(req.body.servicesOffered).split(',').map(s => s.trim()).filter(Boolean);
        } catch (_) {
          servicesOffered = String(req.body.servicesOffered).split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    let workingHours;
    if (req.body.workingHours) {
      try { workingHours = JSON.parse(req.body.workingHours); } catch (_) {}
    }

    let reviews;
    if (req.body.reviews) {
      try { reviews = JSON.parse(req.body.reviews); } catch (_) {}
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
      servicesOffered,
      workingHours,
      reviews,
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

// Helpers
async function assertOwnership(req, res, serviceId) {
  const seller = await Seller.findOne({ userId: req.user._id });
  if (!seller) {
    res.status(403).json({ message: 'Seller profile required' });
    return { ok: false };
  }
  const svc = await Service.findById(serviceId);
  if (!svc) {
    res.status(404).json({ message: 'Service not found' });
    return { ok: false };
  }
  if (String(svc.sellerId) !== String(seller._id)) {
    res.status(403).json({ message: 'Not authorized to modify this service' });
    return { ok: false };
  }
  return { ok: true, svc };
}

// PATCH /api/v1/services/:id/services-offered
async function updateServicesOffered(req, res) {
  try {
    const { id } = req.params;
    const ownership = await assertOwnership(req, res, id);
    if (!ownership.ok) return;
    let servicesOffered = req.body.servicesOffered;
    if (typeof servicesOffered === 'string') {
      try { servicesOffered = JSON.parse(servicesOffered); } catch (_) {
        servicesOffered = servicesOffered.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(servicesOffered)) {
      return res.status(400).json({ message: 'servicesOffered must be an array' });
    }
    const updated = await Service.findByIdAndUpdate(id, { $set: { servicesOffered } }, { new: true });
    return res.json({ message: 'Updated servicesOffered', data: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Failed to update servicesOffered' });
  }
}

// PATCH /api/v1/services/:id/working-hours
async function updateWorkingHours(req, res) {
  try {
    const { id } = req.params;
    const ownership = await assertOwnership(req, res, id);
    if (!ownership.ok) return;
    let workingHours = req.body.workingHours;
    if (typeof workingHours === 'string') {
      try { workingHours = JSON.parse(workingHours); } catch (_) {}
    }
    if (!Array.isArray(workingHours)) {
      return res.status(400).json({ message: 'workingHours must be an array' });
    }
    const updated = await Service.findByIdAndUpdate(id, { $set: { workingHours } }, { new: true });
    return res.json({ message: 'Updated workingHours', data: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Failed to update workingHours' });
  }
}

// PATCH /api/v1/services/:id/reviews
async function updateReviews(req, res) {
  try {
    const { id } = req.params;
    const ownership = await assertOwnership(req, res, id);
    if (!ownership.ok) return;
    // Two modes: replace entire array via `reviews`, or add one via rating/comment
    if (req.body.reviews) {
      let reviews = req.body.reviews;
      if (typeof reviews === 'string') {
        try { reviews = JSON.parse(reviews); } catch (_) {}
      }
      if (!Array.isArray(reviews)) {
        return res.status(400).json({ message: 'reviews must be an array' });
      }
      const updated = await Service.findByIdAndUpdate(id, { $set: { reviews } }, { new: true });
      return res.json({ message: 'Replaced reviews', data: updated });
    }
    const rating = req.body.rating ? Number(req.body.rating) : undefined;
    const comment = req.body.comment;
    if (!rating && !comment) {
      return res.status(400).json({ message: 'Provide `reviews` array or rating/comment' });
    }
    const review = {
      userId: req.user._id,
      rating: rating,
      comment: comment,
      createdAt: new Date(),
    };
    const updated = await Service.findByIdAndUpdate(
      id,
      { $push: { reviews: review } },
      { new: true }
    );
    return res.json({ message: 'Added review', data: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Failed to update reviews' });
  }
}

module.exports.updateServicesOffered = updateServicesOffered;
module.exports.updateWorkingHours = updateWorkingHours;
module.exports.updateReviews = updateReviews;

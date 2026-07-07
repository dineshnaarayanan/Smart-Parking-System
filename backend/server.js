const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, isMock } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const User = require('./models/User');
const ParkingSlot = require('./models/ParkingSlot');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Seeding helper for MongoDB (only runs if MongoDB is connected, else memoryStore handles seeding)
async function seedMongooseDatabase() {
  try {
    const slotCount = await ParkingSlot.countDocuments();
    if (slotCount === 0) {
      console.log('Seeding initial parking slots in MongoDB...');
      const slotsToSeed = [];
      let spotCounter = 101;

      for (let floor = 0; floor <= 2; floor++) {
        for (let i = 1; i <= 8; i++) {
          const type = i <= 2 ? 'EV' : (i === 3 ? 'Handicapped' : 'Regular');
          const rate = type === 'EV' ? 5.0 : (type === 'Handicapped' ? 2.0 : 3.0);
          
          slotsToSeed.push({
            spotNumber: `P-${floor}-${spotCounter++}`,
            floor: floor,
            type: type,
            status: 'available',
            ratePerHour: rate
          });
        }
      }
      await ParkingSlot.insertMany(slotsToSeed);
      console.log('Parking slots seeded successfully.');
    }

    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('Seeding default admin user in MongoDB (admin@parking.com / admin123)...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'System Admin',
        email: 'admin@parking.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Default admin user seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding MongoDB:', error.message);
  }
}

// Connect Database
connectDB().then(() => {
  if (!isMock()) {
    seedMongooseDatabase();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// Root path details
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Parking Booking System API',
    status: 'Running',
    databaseMode: isMock() ? 'In-Memory Mock' : 'MongoDB (Mongoose)'
  });
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database Mode: ${isMock() ? 'In-Memory Mock' : 'MongoDB (Mongoose)'}`);
});

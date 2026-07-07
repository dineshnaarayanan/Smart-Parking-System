const User = require('../models/User');
const db = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

const userRepository = {
  async findByEmail(email) {
    if (db.isMock()) {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user ? { ...user } : null;
    }
    return await User.findOne({ email: email.toLowerCase() });
  },

  async findById(id) {
    if (db.isMock()) {
      const user = memoryStore.users.find(u => u._id === id);
      return user ? { ...user } : null;
    }
    return await User.findById(id);
  },

  async create(userData) {
    if (db.isMock()) {
      const newUser = {
        _id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        role: userData.role || 'customer',
        createdAt: new Date()
      };
      memoryStore.users.push(newUser);
      return { ...newUser };
    }
    const user = new User(userData);
    return await user.save();
  }
};

module.exports = userRepository;

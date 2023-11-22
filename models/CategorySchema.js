const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
     type: String,
     unique: true,
    }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

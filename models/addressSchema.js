const mongoose = require("mongoose");
const { Schema } = mongoose;

const AddressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming your user IDs are ObjectIds
    ref: "collection_1", // Reference to the User model
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pin: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required : true,
  }
});

const address = mongoose.model("Address", AddressSchema);
module.exports = address;

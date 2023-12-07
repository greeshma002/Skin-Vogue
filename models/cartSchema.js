const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,  // Assuming your user IDs are ObjectIds
        ref: 'collection_1',  // Reference to the User model
        required: true
    },
    product:[{
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',  // Reference to the Product model
        required: true
    },
    quantity: { 
        type: Number,
        required: true,
    },
    productName: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },    
    image: {
        type:[String]
    } 
}]
});
const Cart = mongoose.model("cart",cartItemSchema)

module.exports = Cart;


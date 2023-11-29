"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./config/db"));
const ProductModel_1 = __importDefault(require("./models/ProductModel"));
const OrderModel_1 = __importDefault(require("./models/OrderModel"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const UserModel_1 = __importDefault(require("./models/UserModel"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config({ path: ".env" });
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
// credentials: true,
// origin: ['http://localhost:4200','https://angular-openfabric-test.vercel.app/'],//localhost:5000
// methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));
app.use(function (req, res, next) {
    req.header('Access-Control-Allow-Origin');
    res.header('Content-Type', 'application/json;charset=UTF-8');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
(0, db_1.default)();
const validator = (item, regex) => {
    return regex.test(item);
};
app.get('/', (req, res) => {
    res.send('Server is running...');
});
app.get('/api', (req, res) => {
    res.send('Api is running...');
});
// --------------- Product Routes ---------------- 
app.get('/api/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield ProductModel_1.default.find({});
        if (products) {
            res.status(200).json(products);
        }
        else {
            res.status(404).send({ message: 'Products Not Found' });
        }
    }
    catch (error) {
        res.status(500).send({
            message: 'Error in fetching products',
            error: error
        });
    }
}));
app.get('/api/products/:_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield ProductModel_1.default.findById(req.params._id);
        if (product) {
            res.status(200).json(product);
        }
        else {
            res.status(404).send({ message: 'Product Not Found' });
        }
    }
    catch (err) {
        res.status(500).send({
            message: 'Error in fetching product',
            error: err
        });
    }
}));
app.post('/api/products/add', authMiddleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const product = req.body;
    console.log(product._id);
    if (mongoose_1.default.Types.ObjectId.isValid(product._id)) {
        const productExists = yield ProductModel_1.default.findById(product._id);
        if (productExists) {
            try {
                yield ProductModel_1.default.updateOne({ _id: product._id }, product);
                res.status(200).send({ message: 'Product Edited Successfully!' });
            }
            catch (error) {
                res.status(500).send({
                    message: 'Error in editing product',
                    error: error
                });
            }
            return;
        }
    }
    yield ProductModel_1.default.create({
        name: product.name,
        image: product.image,
        brand: product.brand,
        category: product.category,
        description: product.description,
        price: product.price,
        countInStock: product.countInStock,
        rating: product.rating,
        numReviews: product.numReviews
    }).then((data) => {
        res.status(200).json({
            data,
            message: "Product Added Successfully"
        });
    }).catch((err) => {
        res.status(500).send({
            message: 'Error in adding product',
            error: err
        });
    });
}));
app.post('/api/products/delete', authMiddleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const product = req.body;
    try {
        const productExists = yield ProductModel_1.default.findById(product._id);
        if (productExists) {
            try {
                yield ProductModel_1.default.deleteOne({ _id: product._id });
                res.status(200).send({ message: 'Product Deleted Successfully!' });
            }
            catch (error) {
                res.status(500).send({
                    message: 'Error in Deleting product',
                    error: error
                });
            }
            return;
        }
        res.status(404).send({ message: 'Product Not Found' });
    }
    catch (error) {
        res.status(500).send({
            message: 'Server Error',
            error: error
        });
    }
}));
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
app.post('/api/user/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!validator(email, emailRegex)) {
            res.status(400).send({ message: 'Invalid Format of Email!' });
            return;
        }
        if (password.length < 8) {
            res.status(400).send({ message: 'Password must be atleast 8 characters long!' });
            return;
        }
        const user = yield UserModel_1.default.findOne({ email, password });
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: yield generateToken(user),
            });
        }
        else {
            res.status(401).send({ message: 'Invalid Username or Password!' });
        }
    }
    catch (error) {
        res.status(500).send({
            message: 'Server Error',
            error: error
        });
    }
}));
// --------------- Order Routes ---------------- 
app.get('/api/orders', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield OrderModel_1.default.find({});
        res.status(200).json(orders);
    }
    catch (error) {
        res.status(500).send({
            message: 'Error in fetching orders',
            error: error,
        });
    }
}));
app.get('/api/orders/:orderId', authMiddleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield OrderModel_1.default.findById(req.params.orderId).populate('user', 'name email');
        if (order) {
            res.status(200).json(order);
        }
        else {
            res.status(404).send({ message: 'Order Not Found' });
        }
    }
    catch (error) {
        res.status(500).send({
            message: 'Error in fetching order',
            error: error,
        });
    }
}));
app.post('/api/orders/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderItems, shippingAddress, paymentResult, itemsPrice, taxPrice, shippingPrice, totalPrice, isPaid, paidAt, isDelivered, deliverAt, paymentMethod, } = req.body;
    try {
        const newOrder = yield OrderModel_1.default.create({
            orderItems,
            shippingAddress,
            paymentResult,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid,
            paidAt,
            isDelivered,
            deliverAt,
            paymentMethod,
        });
        res.status(201).json({
            order: newOrder,
            message: 'Order Added Successfully',
        });
    }
    catch (error) {
        res.status(500).send({
            message: 'Error in adding order',
            error: error,
        });
    }
}));
app.put('/api/orders/:orderId/edit', authMiddleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderItems, shippingAddress, paymentResult, itemsPrice, taxPrice, shippingPrice, totalPrice, isPaid, paidAt, isDelivered, deliverAt, paymentMethod, userId } = req.body;
    try {
        const updatedOrder = yield OrderModel_1.default.findByIdAndUpdate(req.params.orderId, {
            userId,
            orderItems,
            shippingAddress,
            paymentResult,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid,
            paidAt,
            isDelivered,
            deliverAt,
            paymentMethod,
        }, { new: true });
        if (updatedOrder) {
            res.status(200).json({
                order: updatedOrder,
                message: 'Order Updated Successfully',
            });
        }
        else {
            res.status(404).send({ message: 'Order Not Found' });
        }
    }
    catch (error) {
        res.status(500).send({
            message: 'Error in updating order',
            error: error,
        });
    }
}));
app.delete('/api/orders/:orderId/delete', authMiddleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedOrder = yield OrderModel_1.default.findByIdAndDelete(req.params.orderId);
        if (deletedOrder) {
            res.status(200).json({
                order: deletedOrder,
                message: 'Order Deleted Successfully',
            });
        }
        else {
            res.status(404).send({ message: 'Order Not Found' });
        }
    }
    catch (error) {
        res.status(500).send({
            message: 'Error in deleting order',
            error: error,
        });
    }
}));
// --------------- User Routes -------------------------------------------
app.get('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const Users = yield UserModel_1.default.find({});
        if (Users) {
            res.status(200).json(Users);
        }
        else {
            res.status(404).send({ message: 'Users Not Found' });
        }
    }
    catch (error) {
        res.status(500).send({
            message: 'Error in fetching Users',
            error: error
        });
    }
}));
app.post('/api/users/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, isAdmin } = req.body;
        const existingUser = yield UserModel_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const newUser = new UserModel_1.default({
            name,
            email,
            password,
            isAdmin,
        });
        const salt = yield bcryptjs_1.default.genSalt(10);
        newUser.password = yield bcryptjs_1.default.hash(newUser.password, salt);
        const savedUser = yield newUser.save();
        res.status(201).json({
            user: savedUser,
            message: 'User added successfully',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error in adding user',
            error: error.message,
        });
    }
}));
// --------------------------------------------------
const generateToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const token = jsonwebtoken_1.default.sign({
        email: user.email,
    }, `${process.env.JWT_SECRET}`, {
        expiresIn: '30d'
    });
    return token;
});
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
//# sourceMappingURL=index.js.map
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
const UserModel_1 = __importDefault(require("./models/UserModel"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config({ path: ".env" });
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: ['http://localhost:4200'] //localhost:5000
}));
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
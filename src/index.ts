import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectToDb from './config/db';
import Product from './models/ProductModel';
import User from './models/UserModel';
import { protect } from './middleware/authMiddleware';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({path:".env"})

const app = express();

app.use(express.json());
app.use(cors({
    // credentials: true,
    // origin: ['http://localhost:4200','https://angular-openfabric-test.vercel.app/'],//localhost:5000
    // methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));

app.use(function (req, res, next) {
    req.header('Access-Control-Allow-Origin');
    res.header('Content-Type', 'application/json;charset=UTF-8')
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    )
    next()
  })

connectToDb();

const validator = (item: string, regex: RegExp): boolean => {
    return regex.test(item);
};

app.get('/', (req, res) => {
    res.send('Server is running...');
});

app.get('/api', (req, res) => {
    res.send('Api is running...');
});

app.get('/api/products', async (req: Request, res: Response) => {
    try {
        const products = await Product.find({});
        if (products) {
            res.status(200).json(products);
        } else {
            res.status(404).send({ message: 'Products Not Found' });
        }
    } catch (error) {
        res.status(500).send({
            message: 'Error in fetching products',
            error: error
        });
    }
});

app.get('/api/products/:_id', async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params._id);
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).send({ message: 'Product Not Found' });
        }
    } catch (err) {
        res.status(500).send({
            message: 'Error in fetching product',
            error: err
        });
    }
});

app.post('/api/products/add', protect, async (req: Request, res: Response) => {
    const product = req.body;
    if(mongoose.Types.ObjectId.isValid(product._id)){
        const productExists = await Product.findById(product._id);
        if (productExists) {
            try {
                await Product.updateOne({ _id: product._id }, product);
                res.status(200).send({ message: 'Product Edited Successfully!' });
            } catch (error) {
                res.status(500).send({
                    message: 'Error in editing product',
                    error: error
                });
            }
            return;
        }
    }
    await Product.create(
        {
            name: product.name,
            image: product.image,
            brand: product.brand,
            category: product.category,
            description: product.description,
            price: product.price,
            countInStock: product.countInStock,
            rating: product.rating,
            numReviews: product.numReviews
        }
    ).then((data) => {
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
});

app.post('/api/products/delete', protect, async (req: Request, res: Response) => {
    const product = req.body;
    try {
        const productExists = await Product.findById(product._id);
        if (productExists) {
            try {
                await Product.deleteOne({ _id: product._id });
                res.status(200).send({ message: 'Product Deleted Successfully!' });
            } catch (error) {
                res.status(500).send({
                    message: 'Error in Deleting product',
                    error: error
                });
            }
            return;
        }
        res.status(404).send({ message: 'Product Not Found' });
    } catch (error) {
        res.status(500).send({
            message: 'Server Error',
            error: error
        });
    }
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
app.post('/api/user/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!validator(email, emailRegex)) {
            res.status(400).send({ message: 'Invalid Format of Email!' });
            return;
        }
        if(password.length < 8){
            res.status(400).send({ message: 'Password must be atleast 8 characters long!' });
            return;
        }

        const user = await User.findOne({ email, password });
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: await generateToken(user),
            });
        } else {
            res.status(401).send({ message: 'Invalid Username or Password!' });
        }
    } catch (error) {
        res.status(500).send({
            message: 'Server Error',
            error: error
        });
    }
});

const generateToken = async (user: any) => {
    const token = jwt.sign({
        email: user.email,
    }, `${process.env.JWT_SECRET}`, {
        expiresIn: '30d'
    });
    return token;
};

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});



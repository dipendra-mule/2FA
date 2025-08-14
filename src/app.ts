import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

import './config/passport';

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}
app.use(session({ secret: sessionSecret, resave: false, saveUninitialized: false, cookie: { secure: false } }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/2fa', userRoutes);

// Serve static files
app.use(express.static('public'));

export default app;


const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        portfolio: {
          create: {
            cashBalance: 100000
          }
        }
      }
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body
    
    const existingUser = await prisma.user.findUnique({
        where : { email }
    });

    if (!existingUser) {
        return res.status(400).json({error: 'Invalid credentials'});
    }

    const isMatch = await bcrypt.compare(password, existingUser.passwordHash)
    if (!isMatch) {
        return res.status(400).json({error: 'Invalid credentials'});
    } 
    const token = jwt.sign(
        {userId: existingUser.id},
        process.env.JWT_SECRET,
        {expiresIn: '7d'}
    );

    res.status(200).json({ token, userId: existingUser.id });
    
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
  }
}

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {id: req.userId},
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    }) 
    if (!user) {
      return res.status(400).json({error: 'User not found'})
    }
    return res.status(200).json({user})

  } catch (error) {
      return res.status(500).json({error: 'Something went wrong'})
  }
}
module.exports = { signup, login, getMe };
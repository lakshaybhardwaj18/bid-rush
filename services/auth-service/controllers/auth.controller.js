const { JsonWebTokenError } = require('jsonwebtoken')
const User=require('../models/user.model')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');
//---------Register
const register = async(req,res)=>{
    try{
        const {name,email,password,phone,city}=req.body;
        if(!name || !email ||!password ||!phone || !city){
            return res.status(400).json({message:'All fields are required'})
        }
        const existingUser= await User.findOne({email});
        if(existingUser){
            return res.status(409).json({message:'Email already registered'});
        }
        const saltRounds=10;
        const hashedPassword=await bcrypt.hash(password,saltRounds);
        const user= new User({
            name,email,password:hashedPassword,phone,city
        })
        await user.save();
        const token=jwt.sign(
            {userId: user._id,email:user.email},
            process.env.JWT_SECRET,
            {expiresIn:'7d'}
        )
        res.status(201).json({
            message:'User registered successfully',
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                city : user.city
            }
        })
    }catch(error){
        console.error('Register error:',error)
        res.status(500).json({message:'Server error during registration'})
    }
}
//------------LOGIN-----
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user by email
    const foundUser = await User.findOne({ email })
    if (!foundUser) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, foundUser.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: foundUser._id, email: foundUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        city: foundUser.city
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
}
//------------Get user by id (used by notification service)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
                           .select('-password') // never send password
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error fetching user' })
  }
}
//--Get logged in user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
                           .select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json(user)
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ message: 'Server error fetching profile' })
  }
}
module.exports = { register, login, getUserById, getProfile }
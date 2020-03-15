const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');


const User = require('../../models/User');

// @route  POST api/posts
// @desc   Register user
// @access Public
router.post(
  '/', 
  [
    check('name', 'Name is required')
    .not()
    .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password',
          'Please enter a password with 6 or more characters'
          ).isLength({ min: 6 }) 

  ],
 async (req,res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }

  const{ name, email, password } = req.body
try {

  // See if user exist
  let user = await User.findOne({email})

  if(user){
     res.status(400).json({ errors: [{msg: 'User already exist'}]})
  }

  // Get users gravatar
  // CREATE THE USER
  const avatar = gravatar.url(
    email,
    {
      s: '200',
      r: 'pg',
      d: 'mm'
    })
    user = new User ({
      name,
      email,
      avatar,
      password
    })

  // HASH the password
  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hash(password, salt);
  
  // Save the user to the DB
  await user.save();

  // Return jsonwebtoken
  //res.send('User registered');
  
  // GET the payload which include the user Id
  const payload = {
    user: {
      id: user.id
    }
  }

  // sign the token pass payload, secret, expiration
  // inside the callBack we get either token or error
  // in case of token we send it back to the client
  jwt.sign(
    payload,
    config.get('jwtSecret'),
     { expiresIn: 3600000 },
     (err,token)=>{
       if(err) throw err;
       res.json({ token });
     }

  );

} catch(err){
  console.error(err.message);
  res.status(500).send('Server error');
}


  
}); 
 
module.exports = router;
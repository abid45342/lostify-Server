require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



app.use(cors({
  origin: [
    "http://localhost:5174",
    "https://lositfy.web.app",
    "https://lositfy.firebaseapp.com"
  ],
  credentials:true,
}));  
app.use(express.json());
app.use(cookieParser());

const logger = (req,res,next)=>{
  console.log('inside the logger');
  next(); 
}

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' });
  }

 
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
      }
      req.user = decoded;
      console.log(req.user);
     
      next();
  })
}








const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uxfsb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {






    // Auth related APIs
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'1h'});
      res
      .cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
             // secure:true,
         // sameSite: "none",
      })
      
      .send({success:true}); 

    })

    app.post('/logout',(req,res)=>{
      res.clearCookie('token',{
        httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({success:true});
    })







    const itemsCollection = client.db('Lostify').collection('itemsCollection')

    app.post('/addItems',verifyToken,async(req,res)=>{
        const item=req.body;

        const result = await itemsCollection.insertOne(item);
        console.log(req.cookies)
       
        res.send(result);
        console.log(result)
    })


    app.get('/allitems',async(req,res)=>{
     
      const email = req.query.email;
      let query ={};
      if(email){
          query = {email:email};
      }
    
     

      const cursor = itemsCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
  })
    

    app.get('/items',verifyToken   ,async(req,res)=>{
     
        const email = req.query.email;
        let query ={};
        if(email){
            query = {email:email};
        }
        
      
        if(req.user.email != req.query.email){
          return res.status(403).send({message:'forbidden access'});
        }

        const cursor = itemsCollection.find(query);
        const items = await cursor.toArray();
        res.send(items);
    })

    app.get('/items/:id',verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await itemsCollection.findOne(query);
        res.send(result);
    });
 

    app.patch('/items/:id',verifyToken,async(req,res)=>{
      const id = req.params.id;
      const updateDtata = req.body;
      const query = {_id:new ObjectId(id)};
      console.log(req.cookies)
      const update = {
        $set:updateDtata
      };
      const result = await itemsCollection.updateOne(query,update);

      if(result.modifiedCount>0){
        res.send({message :'Item status updated successfully', result });
      }
      else{
        res.send({message :'Item status not updated', result });
      }
    })

    app.delete('/items/:id',verifyToken,async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)};
      const result = await itemsCollection.deleteOne(query);
      res.send(result);
    })


    
    


    const recoveredCollection = client.db('Lostify').collection('recoveredCollection')

    app.post('/recovered',async(req,res)=>{
        const recovered=req.body;
        const result = await recoveredCollection.insertOne(recovered);
        res.send(result);
        console.log(result)
    })
app.get('/allrecovered/email',verifyToken,async(req,res)=>{
    const cursor = recoveredCollection.find({});
    const recovered = await cursor.toArray();
    res.send(recovered);

})

app.get('/allrecovered/:email', verifyToken, async (req, res) => {
  try {
      const email = req.params.email; // Get email from URL parameter
      let query = {}; // Default query (no filter)

      // If email is provided in the query, set it in the query object
      if (email) {
          query = { "recoveredBy.email": email }; // Adjusting the query to search within 'recoveredBy.email'
      }

      // Check if the email in the URL matches the logged-in user's email
      if (req.user.email !== email) {
          return res.status(403).send({ message: 'Forbidden access' });
      }

      // Fetch the items from the database based on the query
      const cursor = recoveredCollection.find(query);
      const items = await cursor.toArray();
      
      // Send the fetched items as the response
      res.send(items);
  } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).send({ error: 'An error occurred while fetching items.' });
  }
});



 












   
    // await client.connect();
   
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);









app.get('/',(req,res)=>{
    res.send("sever started");
})

app.listen(port,()=>{
    console.log(`server started on port ${port}`);
})



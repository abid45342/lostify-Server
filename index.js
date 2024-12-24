const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());






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

    const itemsCollection = client.db('Lostify').collection('itemsCollection')

    app.post('/addItems',async(req,res)=>{
        const item=req.body;
        const result = await itemsCollection.insertOne(item);
        res.send(result);
        console.log(result)
    })
    

    app.get('/items',async(req,res)=>{
        const email = req.query.email;
        let query ={};
        if(email){
            query = {email:email};
        }
        const cursor = itemsCollection.find(query);
        const items = await cursor.toArray();
        res.send(items);
    })

    app.get('/items/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await itemsCollection.findOne(query);
        res.send(result);
    });
 

    app.patch('/items/:id',async(req,res)=>{
      const id = req.params.id;
      const updateDtata = req.body;
      const query = {_id:new ObjectId(id)};
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

    app.delete('/items/:id',async(req,res)=>{
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
app.get('/allrecovered',async(req,res)=>{
    const cursor = recoveredCollection.find({});
    const recovered = await cursor.toArray();
    res.send(recovered);

})














   
    await client.connect();
   
    await client.db("admin").command({ ping: 1 });
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



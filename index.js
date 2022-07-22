const express = require('express');

const app = express();

const mongoose = require('mongoose');

const cloudinary = require('cloudinary').v2;

const multer = require('multer');

const fileUpload = multer();

const streamifier = require('streamifier');

cloudinary.config({ 
    cloud_name: 'aps-enterprises-inc', 
    api_key: '492584823981257', 
    api_secret: 'RLRppJ0kTTuH_ghwgrLEX0OidXY',
    
  });

  port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));


const jwt = require('jsonwebtoken');



app.use(express.json());

const dbUserName = "asd";
const dbPassword = "123";
const SIGNATURE = "ermntlkxvjserlksnrtm.ansdkadsf";

app.get('/' , (req,res) => {
    res.sendFile(`${__dirname}/index.html`)
})

app.post('/admin', (req, res)=>{
    const { username, password } = req.body;
    if(username === dbUserName && password === dbPassword){
        // generate the token and send to client

        const payload = { username: username, isLogged: true };

        var token = jwt.sign(payload, SIGNATURE, {algorithm: 'HS384', expiresIn: "1d"});
        
        res.json({
            jwtToken: token,
            message: "Authenticated successfully"
        })
    }else {
        res.status(401).send("Invalid Username/password");
       
    }
})

const tokenAuth = (req, res, next) => {
    console.log("Inside Token Auth")
    const token = req.headers["token"];
    if(!token){
        return res.send("Token is not present");
    }
    jwt.verify(token, SIGNATURE, (err, decoded)=>{
        if(err){
            return res.status(401).send("Invalid Token");
        }
        else{
            console.log(decoded);
        }
        next()
    })
}






mongoose.connect('mongodb+srv://amanjotgarcha:nanki123@cluster0.3adda.mongodb.net/month6?retryWrites=true&w=majority');

mongoose.connection.on('connected', () => {
    console.log('Mongoose is connected!!!!');
});


  const studentSchema = new mongoose.Schema({
    
    name: String,
    rollNumber:String,
    standard:String,
    section:String,
    photoURL:String,
    address:{
        line1:String,
        line2:String,
        city:String,
        state:String,
        country:String
    },
    
    parents: {
        type:Array,
        validate:[arrLen, 'A Student can have atmost 2 parents']
    }
});

function arrLen(data){
    return data.length <= 2;
}



const studentModel = mongoose.model('student', studentSchema);


const parentsSchema = new mongoose.Schema({
    name:String,
    phoneNumber:String,
    email:String,
    occupation:String,
    designation:String
})

const parentModel = mongoose.model('parent',parentsSchema);



const fileuploader =     (req, res, next) => {
        console.log('inside fileuploader');
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                  (error, result) => {
                    if (result) {
                      resolve(result);
                    } else {
                      reject(error);
                    }
                  }
                );
    
              streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result)
            if (result){
                let {url} = result;
                console.log(url);
                req.body.fileUrl = url;
                console.log("file uploaded")
                next()
            }
        }
    
        upload(req);
    };
    

//Create routes


app.post('/students',tokenAuth,   async function(req, res, next) {
    
    console.log("Inside student post route");
    var newStudent = new studentModel({
        name:req.body.name,
        rollNumber:req.body.rollNumber,
        standard:req.body.standard,
        section:req.body.section,
        photoURL:req.body.photoURL,
        address:{
        line1:req.body.address["line1"],
        line2:req.body.address["line2"],
        city:req.body.address["city"],
        state:req.body.address["state"],
        country:req.body.address["country"]
    },
    
    parents: req.body.parents

    })
    try{
       const result = await newStudent.save();
       console.log('Student added successfully with id :'+result._id)
       return res.send('Student added successfully with id :'+result._id)
    }catch(error){
        console.log(error);
        return res.status(500).send(error.message);
    }
    // console.log('Student added successfully with id :'+result._id)
    // return res.send('Student added successfully with id :'+result._id)

    
   
});
app.post('/student',tokenAuth, fileUpload.single('image'),fileuploader,  async function(req, res, next) {
    
    console.log("Inside student post route");
    var newStudent = new studentModel({
        name:req.body.name,
        rollNumber:req.body.rollNumber,
        standard:req.body.standard,
        section:req.body.section,
        photoURL:req.body.fileUrl,
        address:{
            line1:req.body.line1,
            line2:req.body.line2,
            city:req.body["city"],
            state:req.body["state"],
            country:req.body["country"]
    
        },
        parents: req.body.parents

    })
    try{
      const result =  await newStudent.save();
      console.log(result)
      console.log(`New Student ${result.name} added to MongoDB in Month6 database with id : ${result._id}`)
      return res.send(`New Student ${result.name} added to MongoDB in Month6 database with id : ${result._id}`)
    }catch(error){
        console.log(error);
        return res.status(500).send(error.message);
    }
    

    
   
});

app.post('/parent',tokenAuth, async function(req, res, next) {
    console.log("Inside parent post route");
    var newParent = new parentModel({
        name:req.body.name,
        phoneNumber:req.body.phoneNumber,
        email:req.body.email,
        occupation:req.body.occupation,
        designation:req.body.designation

    })
    try{
        const result = await newParent.save();
        console.log(`New Parent ${result.name} added Successfully MongoDB in month6 database with id : ${result._id}`)
        res.send(`New Parent ${result.name} added Successfully MongoDB in month6 database with id : ${result._id}`)
    }catch(error){
        console.log(error);
        return res.status(500).send(error.message)
    }
    


   
});

app.post('/student/:id/:parent',tokenAuth ,async(req,res) => {
    const filter = {_id:req.params.id}
    const result = await studentModel.find(filter)
    // let Res = {parent1:result[0].parents[0],parent2:result[0].parents[1]}
    console.log(result[0].parents)
    result[0].parents.push(req.params.parent)

    console.log(result[0].parents)
     
    const target = {_id:req.params.id};
    const updateDocument = {
        $set: {
           parents: result[0].parents,
         },
         };
     const Result = await studentModel.updateOne(target, updateDocument);
     console.log(Result)
     res.send("Doc Updated");
    
});

//REad routes


// get all students in the student collection
app.get('/students', tokenAuth, async (req,res) => {
    const result = await studentModel.find();
    res.json(result)
})


// get all parents in the parent collection
app.get('/parent', async (req,res) => {
    const result = await parentModel.find();
    res.json(result)
})


// return specific student from the student collection 
app.get('/student/:id',tokenAuth, async (req,res) => {
    const filter = {_id:req.params.id}
    const result = await studentModel.find(filter)
    res.json(result)
});

//return specific parent from the parent collection 
app.get('/parent/:id',tokenAuth, async (req,res) => {
    const filter = {_id:req.params.id}
    const result = await parentModel.find(filter)
    res.json(result)
});




// returns a list of the corresponding student’s parents
app.get('/student/:id/parent',tokenAuth, async (req,res) => {
    const filter = {_id:req.params.id}
    const result = await studentModel.find(filter)
    console.log(result[0].parents,typeof(result[0].parents[0]))
    const parentfilter = {_id:result[0].parents[0]}
    const parentfilter1 = {_id:result[0].parents[1]}
    const parentresult = await parentModel.find(parentfilter)
    const parentresult1 = await parentModel.find(parentfilter1)
    const parents = {parentresult,parentresult1}
    console.log(parentresult,parentfilter1)
    
    res.json(parents)
});


//Delete Routes


// delete a student
app.delete('/student/:id',tokenAuth,async(req,res) => {
    console.log(req.params.name)
    const filter = { _id:req.params.id};

    
    const result = await studentModel.deleteOne(filter);
    console.log(result)
    res.send(`Student deleted from students collection`)

});

app.delete('/parent/:id',tokenAuth,async(req,res) => {
    console.log(req.params.id)
    const filter = { _id:req.params.id};

    
    const result = await parentModel.deleteOne(filter);
    console.log(result)
    res.send("Parent deleted from parent Collection" )

});

//Update Routes


// update the name of a student
app.patch('/student/:id/:newname',tokenAuth,async(req,res) => {
    
    const filter = {_id:req.params.id};
    
    const updateDocument = {
   $set: {
      name: req.params.newname,
    },
    };
const result = await studentModel.updateOne(filter, updateDocument);
console.log(result)
res.send("Doc Updated");
    
});


// update the name of a parent
app.patch('/parent/:id/:newname',tokenAuth,async(req,res) => {
    
    const filter = {_id:req.params.id};
    
    const updateDocument = {
   $set: {
      name: req.params.newname,
    },
    };
const result = await parentModel.updateOne(filter, updateDocument);
console.log(result)
res.send("Doc Updated");
    
});






app.listen(port,console.log('App is live on :',port))
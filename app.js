const express = require('express')
const serverless = require('serverless-http')
const app = express()
const router = express.Router();
const cors = require('cors')
const mongoose = require('mongoose')
const axios = require('axios')
const NewCompany = require('../models/company');
const NewDriver = require('../models/driver')
const NewUser = require('../models/users')

//MIDDLEWARE // //MIDDLEWARE ////MIDDLEWARE ////MIDDLEWARE ////MIDDLEWARE //
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())
app.use('/', router);
const port = 3001
//MIDDLEWARE ////MIDDLEWARE ////MIDDLEWARE ////MIDDLEWARE ////MIDDLEWARE //

///*************************************************************************** */

//DB CONNECTION ////DB CONNECTION ////DB CONNECTION ////DB CONNECTION //

const dbUri = `mongodb+srv://karontianpch:PasswordAtlasDB1@cluster0.2zjvwuj.mongodb.net/board?retryWrites=true&w=majority&appName=Cluster0`
async function connectToDb(){
    try {
        await mongoose.connect(dbUri, {useNewUrlParser: true, useUnifiedTopology: true} );
        console.log('Connected to DB')
    } catch(err){
        console.log(err)
    }
}
connectToDb()
//DB CONNECTION ////DB CONNECTION ////DB CONNECTION ////DB CONNECTION //

///*************************************************************************** */

//MAIN BOARD ROUTES //  //MAIN BOARD ROUTES //  //MAIN BOARD ROUTES //  //MAIN BOARD ROUTES // 
function mainBoardUpdatesPush (){ //SERVER SENT EVENTS FOR MAIN BOARD INFO RETREIVAL
    let clients = []
    router.get('/clientUpdates', async(req,res)=>{ // BACK END SERVER SIDE  EVENTS MAIN CLIENTS
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        clients.push(res)
        req.on('close', ()=>{
            clients = clients.filter(client=> client !== res)
        })

    })

    async function sendUpdates(){ // BACK END SERVER SIDE  EVENTS  MAIN CLIENTS
        const currentClients = await NewCompany.find()
            clients.forEach(client=>{ 
                // console.log(client);
                client.write(`data: ${JSON.stringify(currentClients)}\n\n`)
            }
        )
    }

    const changeStream = NewCompany.watch(); // BACK END SERVER SIDE EVENTS MAIN CLIENTS 
    changeStream.on('change', (change) => { // BACK END SERVER SIDE  EVENTS MAIN CLIENTS 
        sendUpdates();
    });
}
mainBoardUpdatesPush()//SERVER SENT EVENTS FOR MAIN BOARD INFO RETREIVAL

//COMPANY ROUTES//

router.get('/getClients', async(req,res)=>{//gets all companies
    try {
        let clients = await NewCompany.find()
        res.json({clients})
    } catch (error) {
        console.log(error)
    }
})

router.post('/newCompany', async(req,res)=>{//adds a new company

    console.log('NEW COMPANY ADD', req.params, req.body)
    try {
        const newAdd = new NewCompany({
            companyName: req.body.companyName,
            ownerName: req.body.ownerName,
            ownerPhoneNumber: req.body.ownerPhoneNumber ,
            companyPhoneNumber: req.body.companyPhoneNumber,
            address: req.body.address,
            mcNumber: req.body.mcNumber,
            dotNumber: req.body.dotNumber,
            einNumber: req.body.einNumber,
        })
        await newAdd.save()
        res.status(201).json(newAdd)
    } catch (err){
        res.status(500).json({ message: 'Server error' });
        console.log(err)
    }
})

router.put('/companyEdit/:id', async (req, res) => {//UPDATES A COMPANY BY ID
    try {
        const { id } = req.params; // Extracting ID from URL
        const updateData = {
            companyName: req.body.companyName,
            ownerName: req.body.ownerName,
            ownerPhoneNumber: req.body.ownerPhoneNumber,
            companyPhoneNumber: req.body.companyPhoneNumber,
            address: req.body.address,
            mcNumber: req.body.mcNumber,
            dotNumber: req.body.dotNumber,
            einNumber: req.body.einNumber,
        };

        // Updating the document
        const updatedCompany = await NewCompany.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedCompany) {
            return res.status(404).send({ message: 'Company not found' });
        }
        res.send(updatedCompany);
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).send({ message: 'Error updating company' });
    }
});
router.delete('/deleteCompany/:id', async(req,res)=>{//delete ONE company and its  assigned drivers
    console.log('COMPANY DELETE', req.params)
    try {
        const id = req.params.id
        const companyName = req.params.companyName
        // Wrap deletion operations in Promise.all
        const results = await Promise.all([
            NewCompany.deleteOne({ _id: id }),
            NewDriver.deleteMany({ companyName: companyName })
        ]);
        // results[0] corresponds to deletion result of NewCompany.deleteOne
        // results[1] corresponds to deletion result of NewDriver.deleteMany
        res.send({ companyDeletion: results[0], driversDeletion: results[1] });
    } catch (err) {
        console.log(err)
    }
})//

router.delete('/deleteBulk', async(req,res)=>{//bulk delete all companies
    console.log('BULK DELETE')
    try {
        const deletion = await NewCompany.deleteMany()
        res.send({deletion})
    } catch (err) {
        console.log(err)
    }
})

//DRIVER ROUTES//

function driverBoardUpdatePush(){//Server sent events for driver fetching @ /admin  
    let drivers = []
        router.get('/driverUpdates', async(req,res) => { // BACK END SERVER SIDE EVENTS DRIVER CLIENTS
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
    
            drivers.push(res)
            req.on('close', () => {
                drivers = drivers.filter(driver => driver !== res)
            })
        })
    
        async function sendUpdates() { // BACK END SERVER SIDE EVENTS DRIVER CLIENTS
            const currentDrivers = await NewDriver.find()
            drivers.forEach(driver => { 
                driver.write(`data: ${JSON.stringify(currentDrivers)}\n\n`)
            })
        }
    
        const changeStream = NewDriver.watch(); // BACK END SERVER SIDE EVENTS DRIVER CLIENTS 
        changeStream.on('change', (change) => { // BACK END SERVER SIDE EVENTS DRIVER CLIENTS 
            sendUpdates();
        });
}
driverBoardUpdatePush()////Server sent events for driver fetching @ /admin

router.get('/getDrivers', async(req,res)=>{//gets all drivers in db
    // console.log('GET DRIVERS INVOKED')
    try {
        let drivers  = await NewDriver.find()
        res.json({drivers})
    } catch (err) {
        console.log(err)
    }
})

router.post('/driverAdd', async(req, res) => {//adds  a driver
    console.log('DRIVER ADD', req.body)
    const {currentLocation, driverName, driverPhoneNumber, driverCompany, availableDate, assignedDispatcher, driverStatus, driverLog} = req.body.driverInfo
    const equipmentData = req.body.selectedEquipment.reduce((eq, item) => {
        eq.push({type: item.type, qty: item.qty});
        return eq;
    }, []);
    const trailerInfo = req.body.trailerInfo

    try {
         // Find the company by name
         const company = await NewCompany.findOne({ companyName: driverCompany });
         if (!company) {
             return res.status(404).json({ message: 'Company not found' });
         }
 
         // Use the company's _id for driverCompany
         const newDriver = new NewDriver({
             driverName,
             driverPhoneNumber,
             driverCompany: company._id, // Use company's _id
             currentLocation,
             availableDate,
             selectedEquipment: equipmentData,
             trailerInfo,
             assignedDispatcher: assignedDispatcher,
             driverStatus: driverStatus,
             driverLog: driverLog
         });
 
         await newDriver.save();
         console.log(newDriver)
         res.json(newDriver);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/driverEditSave/:id', async (req, res) => { //edits a driver based on _id
    const { id } = req.params;
    const { driverName, driverPhoneNumber, driverCompany, currentLocation, availableDate } = req.body;
  
    try {
        console.log('EDITING DRIVER', id)
      const updatedDriver = await NewDriver.findByIdAndUpdate(
        id,
        { driverName, driverPhoneNumber, driverCompany, currentLocation, availableDate },
        { new: true } // This option returns the document after update was applied.
      );
  
      if (!updatedDriver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      res.json({ message: 'Driver updated successfully', updatedDriver });
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({ message: 'Error updating driver' });
    }
  });

router.put('/driverTrailerDelete/:id', async (req, res) => {// deletes a trailer fomr a driver
    try {
        const { id } = req.params;
        const { amount, type, len } = req.body;

        // console.log('TRAILER DELETE', req.body, req.params);

        const result = await NewDriver.updateOne(
            { _id: id },
            { $pull: { trailerInfo: { amount, type, length: len } } }
        );

        if (result.nModified === 0) {
            return res.status(404).send('Trailer not found');
        }

        res.send('Trailer deleted successfully');
    } catch (e) {
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/driverTrailerAdd/:id', async(req,res)=>{//adds a trailer from the driver edition
    console.log('UPDATE ADD TRAILER', req.body, req.params)
    const {id} = req.params
    const {amount, type, len, def} = req.body
    try {
            
        const driver =  await NewDriver.findById(id)
        if(!driver){
            return res.status(404).send('Driver NOT Found')
        }


        driver.trailerInfo.push({
            amount: Number(amount),
            type: type,
            length: Number(len),
            def: def
        })

        await driver.save()
        res.status(200).send(driver)


    } catch (err) {
        console.log(err)
    }
})

router.put('/driverEquipmentDelete/:id', async(req,res)=>{//deletes an equipment line from the driver edition
    console.log('DRIVER EQ ADDING', req.body, req.params)
    try {
        const {id} = req.params
        const {type, qty} = req.body

        const result = await NewDriver.updateOne(
            { _id: id },
            { $pull: { selectedEquipment: { type, qty } } }
        );

        if (result.nModified === 0) {
            return res.status(404).send('Equipment not found');
        }

        res.send('Equipment deleted successfully');

        
    } catch (err) {
        console.log(err)
    }
})

router.put('/driverEquipmentAdd/:id', async (req, res) => {//add equipment line from the driver  ediition
    console.log('DRIVER EDITING EQ ADD', req.body, req.params);
        const { id } = req.params;
        const { type, qty } = req.body;

        try {
            const driver = await NewDriver.findById(id);
            if (!driver) {
                return res.status(404).send('Driver NOT Found');
            }

            driver.selectedEquipment.push({
                type: type,
                qty: Number(qty)
            });

            await driver.save();
            res.status(200).send(driver);
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
});

router.put('/driverEditDefaultChange/:id', async (req, res) => { // Changes the default  status of a driver
    // console.log('DEFAULT EDIT', req.params, req.body);
    try {
        const driverId = req.params.id; // Correctly extract the id from req.params
        const trailerId = req.body.trailer.toString(); // Convert trailerId to string
        const editingDriver = await NewDriver.findById(driverId);
        if (!editingDriver) {
            return res.status(404).send('Driver not found');
        }
        console.log('EDITING DRIVER', editingDriver)
        const currentDefTrailer = editingDriver.trailerInfo.find(trailer=>trailer.def === true)
        if (!currentDefTrailer) {
            return res.status(404).send('Default trailer not found');
        }
        currentDefTrailer.def = false
        const newDefTrailer = editingDriver.trailerInfo.find(trailer => trailer._id.toString() === trailerId); // Compare as strings
        newDefTrailer.def = true

        await editingDriver.save()

        // console.log('FOUND ON DRIVER TRAILERS', newDefTrailer, editingDriver);
        res.status(200).send('Default trailer updated successfully');


    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
});

router.put('/driverOfferAccepted/:id', async(req,res)=>{// location and date update from accepted offer
    try {
        const driverId = req.params.id
        const location = req.body.location
        const date = req.body.date
        const comment = req.body.comment;
        console.log(driverId, location, date, comment)

                // Find the driver by id and update the fields
                const editingDriver = await NewDriver.findById(driverId);
                if (!editingDriver) {
                    return res.status(404).send('Driver not found');
                }
        
                editingDriver.currentLocation = location;
                editingDriver.availableDate = date;
                editingDriver.offers.accepted += 1
                editingDriver.driverLog.unshift({comment: comment})

                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                
                const twoDaysFromNow = new Date(today);
                twoDaysFromNow.setDate(today.getDate() + 2);
                const twoDaysFromNowStr = twoDaysFromNow.toISOString().split('T')[0];
                
                // Update driverStatus based on the date
                if (date === todayStr) {
                    editingDriver.driverStatus = 'urgent';
                } else if (date === tomorrowStr) {
                    editingDriver.driverStatus = 'not-urgent';
                } else if (date >= twoDaysFromNowStr) {
                    editingDriver.driverStatus = 'other-date';
                }
                
        
        
                // Save the updated driver document
                await editingDriver.save();
                res.status(200).send({
                    message: 'Driver location and date updated successfully',
                    driver: editingDriver
                });        

    } catch (err) {
        console.log(err)
    }
})

router.put('/driverOfferRejected/:id', async(req,res)=>{// Rejected offer counter and log poster for rejection
    // console.log('UPDATE OFFER REJECTED', req.params, req.body)
    try {
        const driverId = req.params.id
        const comment = req.body.comment
        const sysComment = req.body.sysComment
        console.log('REJECT', driverId, comment, sysComment)
        const editingDriver = await NewDriver.findById(driverId);
        if (!editingDriver) {
            return res.status(404).send('Driver not found');
        }
        editingDriver.offers.rejected += 1
        editingDriver.driverLog.unshift({comment: 'Dispatcher Comments:', comment})
        editingDriver.driverLog.unshift({comment: sysComment})


        await editingDriver.save();
        res.status(200).send({
            message: 'Driver location and date updated successfully',
            driver: editingDriver
        });        


        
    } catch (err) {
        console.log(err)
    }
})

router.put('/driverActiveStateOff/:id', async (req, res) => {// changes driverStauts  to INACTIVE
    console.log('ACTIVE STATUS OFF', req.params, req.body);
    const { id } = req.params;
    const { driverLog } = req.body;
    console.log(driverLog)

    try {
        console.log('Finding driver with ID:', id);
        // Find the driver by id and update the fields
        const editingDriver = await NewDriver.findById(id);
        if (!editingDriver) {
            console.log('Driver not found with ID:', id);
            return res.status(404).send('Driver not found');
        }
        console.log('EDITING DRIVER', editingDriver);
        
        // Update the driverStatus field
        editingDriver.driverStatus = 'inactive';
        editingDriver.driverLog.unshift({ comment: driverLog });

        // Save the updated driver document
        await editingDriver.save();
        console.log('Driver status updated successfully');
        res.status(200).send({
            message: 'Driver status updated successfully',
            driver: editingDriver
        });
    } catch (err) {
        console.error('Error updating driver status:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/driverActiveStateOn/:id', async (req, res) => {// changes driverStauts  to ACTIVE AND sets available date to TODAY
    console.log('ACTIVE STATUS ON', req.params, req.body);
    const { id } = req.params;
    const {driverLog} = req.body
    console.log(driverLog)
    try {
        console.log('Finding driver with ID:', id);
        // Find the driver by id and update the fields
        const editingDriver = await NewDriver.findById(id);
        if (!editingDriver) {
            console.log('Driver not found with ID:', id);
            return res.status(404).send('Driver not found');
        }
        console.log('EDITING DRIVER', editingDriver);
        
        // Update the driverStatus field
        editingDriver.driverStatus = 'urgent';
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        editingDriver.availableDate = formattedDate;
        editingDriver.driverLog.unshift({comment:  driverLog });

        // Save the updated driver document
        await editingDriver.save();
        console.log('Driver status updated successfully');
        res.status(200).send({
            message: 'Driver status updated successfully',
            driver: editingDriver
        });
    } catch (err) {
        console.error('Error updating driver status:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/dispatcherReassign/:id', async(req,res)=>{//changes the assigneed dispaatcher driverID 
    console.log('DISPATCHER RE-ASSIGN', req.body, req.params)
    const {id} = req.params
    const {dispatcher, driverLog} = req.body
    console.log('INFO  TO BE UPDATED', id, dispatcher, driverLog)

    try {
        const editingDriver = await NewDriver.findById(id);
        if (!editingDriver) {
            console.log('Driver not found with ID:', id);
            return res.status(404).send('Driver not found');
        }
        console.log('EDITING DRIVER', editingDriver);
        editingDriver.assignedDispatcher = dispatcher
        editingDriver.driverLog.unshift({comment: driverLog})
        await editingDriver.save();
        console.log('Driver status updated successfully');
        res.status(200).send({
            message: 'Driver status updated successfully',
            driver: editingDriver
        });

    } catch (err) {
        console.log(err)
    }
})

router.put('/dateForceChange/:id', async(req, res)=>{// changes the available date based on driverID
    try {
        const {date, logComment, comment, newLocation} = req.body
        const {id} = req.params
        console.log(date, logComment, comment, id, newLocation)
        const editingDriver = await NewDriver.findById(id)
        editingDriver.availableDate = date
        editingDriver.driverLog.unshift({comment: logComment})
        editingDriver.driverLog.unshift({comment: comment})
        editingDriver.currentLocation = newLocation
        // Get today's date, tomorrow's date, and the date two days from now in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(today.getDate() + 2);
        const twoDaysFromNowStr = twoDaysFromNow.toISOString().split('T')[0];
        
        // Update driverStatus based on the date
        if (date === todayStr) {
            editingDriver.driverStatus = 'urgent';
        } else if (date === tomorrowStr) {
            editingDriver.driverStatus = 'not-urgent';
        } else if (date >= twoDaysFromNowStr) {
            editingDriver.driverStatus = 'other-date';
        }
        
     
        
        await editingDriver.save();
        console.log('Driver updated succesfully')
        res.status(200).send({
            message: 'Driver status updated successfully',
            driver: editingDriver
        });



    } catch (err) {
        console.log(err)
    }
})

router.delete('/driverDelete/:id', async(req,res)=>{//deletes a driver based on its id
    // console.log('DRIVER DELETE', req.params, req.body)
    try {
        const driverId = req.params.id
        const deletion = await NewDriver.deleteOne({_id: driverId})
        res.send({deletion})
    } catch (err) {
        console.log(err)
    }
})

router.delete('/deleteBulkDrivers', async(req, res)=>{//deletes all drivers
    console.log('DELETE BULK')
    try {
        const deletion = await NewDriver.deleteMany()
        res.send({deletion})
    } catch (err) {
        console.log(err)
    }
})

//DRIVER ROUTES//
//USER ROUTES//

router.post('/newUser', async (req, res) => { // Signsup a new user
    console.log('NEW USER ROUTE', req.body, req.params);

    const { newUserName, newPassword } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await NewUser.findOne({ username: newUserName });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        // const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Create a new user instance
        const newUser = new NewUser({
            username: newUserName,
            password: newPassword,
            isAuthenticated: false,
        });

        // Save the user to the database
        await newUser.save();
        console.log(newUser);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.put('/login', async (req, res) => { // user login
    console.log('USER LOGIN', req.body, req.params);
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = await NewUser.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Compare the provided password with the stored password
        if (password !== user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        user.isAuthenticated = true
        await user.save(); // Save the changes to the database

        console.log(user)

        // If the password matches, respond with a success message
        res.status(200).json({ message: 'Login successful', user: user });
    } catch (err) {
        console.log('Error during login:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.put('/logout', async(req,res)=>{//user logout
    console.log('LOGOUT', req.body, req.params)
    try {
        const { username } = req.body;

        // Find the user by username
        const user = await NewUser.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        
        user.isAuthenticated = false
        await user.save(); // Save the changes to the database

        console.log(user)

        // If the password matches, respond with a success message
        res.status(200).json({ message: 'Logout successful', user: user });
    } catch (err) {
        console.log('Error during login:', err);
        res.status(500).json({ message: 'Internal server error' });
    }

})
router.get('/getUsers', async(req,res)=>{//gets ALL USERS
    // console.log('GET USERS')
        try {
            let users  = await NewUser.find()
            // console.log(users)
            res.json({users})
        } catch (err) {
            console.log(err)
        }
})
router.delete('/deleteUser/:id', async(req,res)=>{
    // console.log('DELETE USER', req.params, req.body)
    try {
        const driverId = req.params.id
        console.log(driverId)
        const deletion = await NewUser.deleteOne({username: driverId})
        res.send({deletion})


    } catch (err) {
        console.log(err)
    }
})
//USER ROUTES//




app.listen(port, '0.0.0.0', ()=>{
    console.log(`Server running @ ${port}`)
})


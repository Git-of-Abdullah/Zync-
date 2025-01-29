const dotenv = require("dotenv")
dotenv.config({path: "./config.env"});
const app = require('./app');
const mongoose = require('mongoose')

mongoose.connect( process.env.DB_URL , {})

    .then(() => {
        app.listen( process.env.PORT || 8001, ()=>{
        console.log(`database connected, App is listening on port ${process.env.PORT}`);
    })  
    })
    .catch((error) => {
        console.log('failed to start app');
        console.log(error);
    })

    
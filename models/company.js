const mongoose = require('mongoose')

const NewCompanySchema = new mongoose.Schema({
    companyName: String,
    ownerName: String,
    ownerPhoneNumber: String,
    companyPhoneNumber: String,
    address: String,
    mcNumber: String,
    dotNumber: String,
    einNumber: String,
    
})

const NewCompany = mongoose.model('newCompany', NewCompanySchema)
module.exports = NewCompany
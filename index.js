require('dotenv').config();
const express = require("express")
const { createtable } = require('./db')
const http = require('http')
const path = require('path')

// FOR WEB

const systemUser = require('./Routes/SystemUsers')
const User = require('./Routes/Usres')
const Otp = require('./Routes/Otp')
const Task = require('./Routes/Task')
const Tc = require('./Routes/T & C')
const Request = require('./Routes/Request')
const Transaction = require('./Routes/Transection')
const Bids = require('./Routes/Bids')
const Categories = require('./Routes/Categories')
const SubCategories = require('./Routes/SubCategories')
const ChatBox = require('./Routes/ChatBox')
const Notifications = require('./Routes/Notifications')



// FOR DASHBOARD

const DashboardsystemUser = require('./DashBoardRoutes/User')
const DashboardBids = require('./DashBoardRoutes/Bids')
const DashboardTask = require('./DashBoardRoutes/Task')
const DashboardTc = require('./DashBoardRoutes/t & c')
const DashboardRequest = require('./DashBoardRoutes/Requests')
const DashboardTransaction = require('./DashBoardRoutes/Transections')
const DashboardCategories = require('./DashBoardRoutes/Categories')
const DashboardSubCategories = require('./DashBoardRoutes/SubCategories')
const DashboardNotification = require('./DashBoardRoutes/Notification')

// const DashboardChatBox = require('./DashBoardRoutes/')



// FOR APP

const AppUser = require('./AppRoutes/user')
const AppOtp = require('./AppRoutes/Otp')
const AppTask = require('./AppRoutes/Task')
const AppTc = require('./AppRoutes/T & C')
const AppRequest = require('./AppRoutes/Requests')
const AppTransaction = require('./AppRoutes/Transections')
const AppBids = require('./AppRoutes/Bids')
const AppCategories = require('./AppRoutes/Categories')
const AppSubCategories = require('./AppRoutes/SubCategories')
const AppNotification = require('./AppRoutes/Notification')

// const ChatBox = require('./Routes/ChatBox')

var cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const { create } = require('domain');

const createtable1 = () => {
    try {
        createtable();
    }
    catch (error) {
        console.log("error", error)
    }
}
createtable1()

const app = express()
app.use(cors())
app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: '100mb', extended: 'true' }))
app.use(bodyParser.json({ limit: '100mb' }))
app.use('/storege', express.static(path.join(__dirname, 'storege')));

// FOR WEB

app.use('/systemuser', systemUser)
app.use('/user', User)
app.use('/otp', Otp)
app.use('/task', Task)
app.use('/t&C', Tc)
app.use('/request', Request)
app.use('/transections', Transaction)
app.use('/Bids', Bids)
app.use('/categories', Categories)
app.use('/subcategories', SubCategories)
app.use('/chatbox', ChatBox)
app.use('/notification', Notifications)



// FOR DASHBOARD

app.use('/dashboard/systemuser', DashboardsystemUser)
app.use('/dashboard/task', DashboardTask)
app.use('/dashboard/t&C', DashboardTc)
app.use('/dashboard/request', DashboardRequest)
app.use('/dashboard/transections', DashboardTransaction)
app.use('/dashboard/Bids', DashboardBids)
app.use('/dashboard/categories', DashboardCategories)
app.use('/dashboard/subcategories', DashboardSubCategories)
app.use('/dashboard/notification', DashboardNotification)

// app.use('/dashboard/chatbox', DashboardChatBox)



// FOR APP

app.use('/App/systemuser', AppUser)
app.use('/App/task', AppTask)
app.use('/App/t&C', AppTc)
app.use('/App/request', AppRequest)
app.use('/App/transections', AppTransaction)
app.use('/App/Bids', AppBids)
app.use('/App/categories', AppCategories)
app.use('/App/subcategories', AppSubCategories)
app.use('/App/notification', AppNotification)



const port = 3001 || process.env.appport
const sarver = http.createServer(app)
sarver.listen(port, () => {
    console.log("servar is running at port", +port)

});
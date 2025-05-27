const { Sequelize, Model } = require('sequelize')

const systemUserModel = require('./Models/SystemUser')
const UserModel = require('./Models/Users')
const OtpModel = require('./Models/Otp')
const TaskModel = require('./Models/Task')
const TcModel = require('./Models/t & c ')
const RequestModel = require('./Models/Requests')
const TransactionModel = require('./Models/Transections')
const PromotionsModel = require('./Models/Promotions')
const BidsModel = require('./Models/Bids')
const CategoriesModel = require('./Models/Categories')
const SubCategoriesModel = require('./Models/SubCategories')
const ChatBoxModel = require('./Models/ChatBox')
const NotificationModel = require('./Models/Notifications')













const sequelize = new Sequelize(

    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,

    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_PROVIDER,
    }
)

const systemUser = systemUserModel(sequelize)
const User = UserModel(sequelize)
const Otp = OtpModel(sequelize)
const Task = TaskModel(sequelize)
const Tc = TcModel(sequelize)
const Request = RequestModel(sequelize)
const Transaction = TransactionModel(sequelize)
const Promotions = PromotionsModel(sequelize)
const Bids = BidsModel(sequelize)
const Categories = CategoriesModel(sequelize)
const SubCategories = SubCategoriesModel(sequelize)
const ChatBox = ChatBoxModel(sequelize)
const Notification = NotificationModel(sequelize)











const createtable = () => {
    try {
        sequelize.authenticate();

        systemUser.sync({ alter: true })
        User.sync({ alter: false })
        Otp.sync({ alter: false })
        Task.sync({ alter: false })
        Tc.sync({ alter: false })
        Request.sync({ alter: true })
        Transaction.sync({ alter: false })
        Promotions.sync({ alter: false })
        Bids.sync({ alter: false })
        Categories.sync({ alter: false })
        SubCategories.sync({ alter: false })
        ChatBox.sync({ alter: false })
        Notification.sync({ alter: false })












        console.log("table created")

    }
    catch (error) {
        console.log("error" + error)
    }
}

module.exports = { sequelize, createtable }
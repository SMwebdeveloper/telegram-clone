const BaseError = require("../errors/base.error")
const userModal = require("../models/user.models")
const mailService = require("../service/mail.service")
class AuthController {
    async login(req, res, next) {
        try {
            const { email } = req.body
            await mailService.sendOtp(email)
            // const existUser = await userModal.findOne({ email })

            // if (existUser) {
            //     throw BaseError.BadRequest("User already exist", [{ email: "User already exist" }])
            // }
            // const createUser = await userModal.create({ email })
            res.status(201).json({ email })
        } catch (error) {
            next(error)
        }
    }
    async verify(req, res, next) {
        const { email, otp } = req.body
        res.json({ email, otp })
    }
}

module.exports = new AuthController()

// CLIENT bilan SERVER data muloqot tili bu JSON formatda bo'ladi
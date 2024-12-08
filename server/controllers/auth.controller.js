const BaseError = require("../errors/base.error")
const userModels = require("../models/user.models")
const userModal = require("../models/user.models")
const mailService = require("../service/mail.service")
class AuthController {
    async login(req, res, next) {
        try {
            const { email } = req.body
            const existUser = await userModal.findOne({ email })

            if (existUser) {
                await mailService.sendOtp(existUser.email)
                return res.status(200).json({ message: "existing_user" })
            }
            const newUser = await userModal.create({ email })
            await mailService.sendOtp(newUser.email)
            res.status(201).json({ message: "new_user" })
        } catch (error) {
            next(error)
        }
    }
    async verify(req, res, next) {
        try {
            const { email, otp } = req.body
            const result = await mailService.verifyOtp(email, otp)
            if (result) {
                await userModels.findOneAndUpdate({ email }, { isVerified: true })
                res.status(200).json({ message: 'verified' })
            }
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new AuthController()

// CLIENT bilan SERVER data muloqot tili bu JSON formatda bo'ladi
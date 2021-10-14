const jwt = require("jsonwebtoken")

const auth = async (req, res, next) => {
  const token = req.header("nToken")
  if (!token) return res.status(401).send("Access Denied")

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET)
    req.user = verified
    next()
  } catch (err) {
    res.status(400).send(err)
  }
}

module.exports = auth

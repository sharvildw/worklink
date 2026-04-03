const Contact = require("../models/Contact");

const createMessage = async (req, res, next) => {
  try {
    const message = await Contact.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || "",
      subject: req.body.subject || "General Inquiry",
      message: req.body.message
    });

    return res.status(201).json({
      message: "Message sent successfully",
      contact: message.toJSON()
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMessage
};

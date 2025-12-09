import Message from '../models/Message.js';

export const sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const msg = new Message({ name, email, message });
    await msg.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message' });
  }
};

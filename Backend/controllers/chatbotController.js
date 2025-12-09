import axios from 'axios';

const ML_CHAT_BACKEND_URL =
  process.env.ML_CHAT_BACKEND_URL || 'http://127.0.0.1:8000';

export const chatWithAssistant = async (req, res) => {
  try {
    const { message, session_id } = req.body;
    console.log(session_id);

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Use provided session_id or generate a default one if missing
    const sessionId = session_id || 'default-session';
    // console.log(sessionId);

    const mlResponse = await axios.post(`${ML_CHAT_BACKEND_URL}/chat`, {
      session_id: sessionId,
      message
    });

    const reply =
      mlResponse.data?.content ||
      mlResponse.data?.reply ||
      mlResponse.data?.message ||
      '';

    return res.status(200).json({
      success: true,
      reply,
      raw: mlResponse.data
    });
  } catch (error) {
    console.error('Chatbot proxy error:', error.response?.data || error.message);

    const status = error.response?.status || 500;
    const detail =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch chatbot response';

    return res.status(status).json({
      success: false,
      message: 'Failed to fetch chatbot response',
      error: detail
    });
  }
};


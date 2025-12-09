import Forecast from '../models/Forecast.js';

/**
 * Get the latest forecast for a user
 */
export const getLatestForecast = async (req, res) => {
  try {
    const userId = req.user.id;

    const forecast = await Forecast.findOne({ userId })
      .sort({ generated_at: -1 })
      .limit(1);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'No forecast found for this user'
      });
    }

    console.log('Sending forecast data:', {
      total_projected_income: forecast.total_projected_income,
      total_projected_expense: forecast.total_projected_expense,
      total_projected_profit: forecast.total_projected_profit,
      income_forecast_count: forecast.income_forecast?.length || 0
    });

    res.status(200).json({
      success: true,
      forecast
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast',
      error: error.message
    });
  }
};

/**
 * Get forecast history for a user
 */
export const getForecastHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const forecasts = await Forecast.find({ userId })
      .sort({ generated_at: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: forecasts.length,
      forecasts
    });
  } catch (error) {
    console.error('Error fetching forecast history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast history',
      error: error.message
    });
  }
};

/**
 * Delete a forecast
 */
export const deleteForecast = async (req, res) => {
  try {
    const forecastId = req.params.id;
    const userId = req.user.id;

    const forecast = await Forecast.findOneAndDelete({
      _id: forecastId,
      userId
    });

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Forecast not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Forecast deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting forecast',
      error: error.message
    });
  }
};

const CarDetails = require('../Models/carModel');


// GET /api/car/:id
exports.getCarDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const carDetails = await CarDetails.findById(id);

        if (!carDetails) {
            return res.status(404).json({
                success: false,
                message: 'Car not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Car details fetched successfully.',
            carDetails,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

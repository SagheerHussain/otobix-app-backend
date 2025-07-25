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



exports.getCarList = async (req, res) => {
    try {
        const cars = await CarDetails.find({}, {
            _id: 1,
            'Front Main': 1,
            Make: 1,
            Model: 1,
            Variant: 1,
            'Price Discovery': 1,
            'Year Month of Manufacture': 1,
            'Odometer Reading ( in kms )': 1,
            'Fuel Type': 1,
            City: 1,
            'Approval Status': 1
        });

        const listings = cars.map(car => ({
            id: car._id.toString(),
            imageUrl: car['Front Main'] || '',
            name: `${car.Make ?? ''} ${car.Model ?? ''} ${car.Variant ?? ''}`.trim(),
            price: parseFloat(car['Price Discovery'] ?? 0),
            year: new Date(car['Year Month of Manufacture']).getFullYear(),
            kmDriven: parseInt(car['Odometer Reading ( in kms )'] ?? 0),
            fuelType: car['Fuel Type'] ?? 'N/A',
            location: car.City ?? 'N/A',
            isInspected: (car['Approval Status'] ?? '').toUpperCase() === 'APPROVED'
        }));

        res.json(listings);
    } catch (error) {
        console.error('Error fetching car listings:', error);
        res.status(500).json({ error: 'Failed to fetch car listings' });
    }
};


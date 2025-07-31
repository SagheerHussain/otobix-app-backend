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
            frontMain: 1,
            make: 1,
            model: 1,
            variant: 1,
            priceDiscovery: 1,
            yearMonthOfManufacture: 1,
            odometerReadingInKms: 1,
            fuelType: 1,
            city: 1,
            approvalStatus: 1,
            rearMain: 1,
            lhsFront45Degree: 1,
            rhsRear45Degree: 1,
            lhsFenderImages: 1,
            rhsFenderImages: 1,
        });

        const listings = cars.map(car => {
            // Safe conversion helpers
            const imageUrl = Array.isArray(car.frontMain) ? car.frontMain[0] : (car.frontMain || '');
            const price = parseFloat(car.priceDiscovery || 0);
            const year = car.yearMonthOfManufacture ? new Date(car.yearMonthOfManufacture).getFullYear() : 'N/A';
            const kmDriven = parseInt(car.odometerReadingInKms || 0);
            const isInspected = (car.approvalStatus || '').toUpperCase() === 'APPROVED';

            const getFirst = (val) => Array.isArray(val) && val.length > 0 ? val[0] : null;
            const imageUrls = [
                getFirst(car.frontMain),
                getFirst(car.rearMain),
                getFirst(car.lhsFront45Degree),
                getFirst(car.rhsRear45Degree),
                getFirst(car.lhsFenderImages),
                getFirst(car.rhsFenderImages)
            ].filter(Boolean); // remove nulls

            return {
                id: car._id.toString(),
                imageUrl,
                name: `${car.make ?? ''} ${car.model ?? ''} ${car.variant ?? ''}`.trim(),
                price,
                year,
                kmDriven,
                fuelType: car.fuelType ?? 'N/A',
                location: car.city ?? 'N/A',
                isInspected,
                imageUrls
            };
        });


        res.json(listings);
    } catch (error) {
        console.error('Error fetching car listings:', error);
        res.status(500).json({ error: 'Failed to fetch car listings' });
    }
};


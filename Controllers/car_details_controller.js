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
            make: 1,
            model: 1,
            variant: 1,
            priceDiscovery: 1,
            yearMonthOfManufacture: 1,
            odometerReadingInKms: 1,
            ownerSerialNumber: 1,
            fuelType: 1,
            commentsOnTransmission: 1,
            taxValidTill: 1,
            registrationNumber: 1,
            registeredRto: 1,
            city: 1,
            approvalStatus: 1,
            // Images
            frontMain: 1,
            rearMain: 1,
            lhsFront45Degree: 1,
            rearWithBootDoorOpen: 1,
            rhsRear45Degree: 1,
            engineBay: 1,
            meterConsoleWithEngineOn: 1,
            frontSeatsFromDriverSideDoorOpen: 1,
            rearSeatsFromRightSideDoorOpen: 1,
            dashboardFromRearSeat: 1,
            sunroofImages: 1
        });

        const listings = cars.map(car => {


            // const getFirst = (val) => Array.isArray(val) && val.length > 0 ? val[0] : null;
            // const imageUrls = [
            //     getFirst(car.frontMain),
            //     getFirst(car.rearMain),
            //     getFirst(car.lhsFront45Degree),
            //     getFirst(car.rhsRear45Degree),
            //     getFirst(car.rearWithBootDoorOpen),
            //     getFirst(car.engineBay),
            //     getFirst(car.meterConsoleWithEngineOn),
            //     getFirst(car.frontSeatsFromDriverSideDoorOpen),
            //     getFirst(car.rearSeatsFromRightSideDoorOpen),
            //     getFirst(car.dashboardFromRearSeat),
            //     getFirst(car.sunroofImages)
            // ].filter(Boolean); // remove nulls

            const getFirstImage = (val) => {
                if (Array.isArray(val)) return val.length > 0 ? val[0] : null;
                if (typeof val === 'string') return val;
                return null;
            };


            const imageMapping = [
                { field: 'frontMain', title: 'Front View' },
                { field: 'rearMain', title: 'Rear View' },
                { field: 'lhsFront45Degree', title: 'Left Front 45°' },
                { field: 'rhsRear45Degree', title: 'Right Rear 45°' },
                { field: 'rearWithBootDoorOpen', title: 'Boot Open View' },
                { field: 'engineBay', title: 'Engine Compartment' },
                { field: 'meterConsoleWithEngineOn', title: 'Meter Console' },
                { field: 'frontSeatsFromDriverSideDoorOpen', title: 'Front Seats' },
                { field: 'rearSeatsFromRightSideDoorOpen', title: 'Rear Seats' },
                { field: 'dashboardFromRearSeat', title: 'Dashboard View' },
                { field: 'sunroofImages', title: 'Sunroof View' },
            ];

            const imageUrls = imageMapping.map(({ field, title }) => {
                const url = getFirstImage(car[field]);
                return url ? { title, url } : null;
            }).filter(Boolean);

            // Safe conversion helpers
            const imageUrl = Array.isArray(car.frontMain) ? car.frontMain[0] : (car.frontMain || '');
            const isInspected = (car.approvalStatus || '').toUpperCase() === 'APPROVED';

            return {
                id: car._id.toString() ?? '',
                imageUrl,
                make: car.make ?? '',
                model: car.model ?? '',
                variant: car.variant ?? '',
                priceDiscovery: parseFloat(car.priceDiscovery || 0),
                yearMonthOfManufacture: car.yearMonthOfManufacture ?? null,
                odometerReadingInKms: parseInt(car.odometerReadingInKms || 0),
                ownerSerialNumber: parseInt(car.ownerSerialNumber || 0),
                fuelType: car.fuelType ?? '',
                commentsOnTransmission: car.commentsOnTransmission ?? '',
                taxValidTill: car.taxValidTill ?? null,
                registrationNumber: car.registrationNumber ?? '',
                registeredRto: car.registeredRto ?? '',
                inspectionLocation: car.city ?? '',
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


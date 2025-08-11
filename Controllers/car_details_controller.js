const CarDetails = require('../Models/carModel');
const SocketService = require('../Config/socket_service');
const CONSTANTS = require('../Utils/constants');
const EVENTS = require('../Sockets/socket_events');
const BidModel = require('../Models/bidModel');


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
            highestBid: 1,
            auctionStartTime: 1,
            auctionEndTime: 1,
            auctionDuration: 1,
            auctionStatus: 1,
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
                highestBid: car.highestBid ?? 0,
                auctionStartTime: car.auctionStartTime ?? null,
                auctionEndTime: car.auctionEndTime ?? null,
                auctionDuration: parseInt(car.auctionDuration || 0),
                auctionStatus: car.auctionStatus ?? '',
                imageUrls

            };
        });


        res.json(listings);
    } catch (error) {
        console.error('Error fetching car listings:', error);
        res.status(500).json({ error: 'Failed to fetch car listings' });
    }
};


// Update bid
exports.updateBid = async (req, res) => {
    try {
        const { carId, newBidAmount, userId } = req.body;

        if (!carId || !newBidAmount || !userId) {
            return res.status(400).json({ error: 'carId and newBid and userId are required' });
        }

        //  Fetch car to validate bid
        const carDetailsForValidation = await CarDetails.findById(carId);
        if (!carDetailsForValidation) {
            return res.status(404).json({ error: 'Car not found' });
        }

        //  Prevent lower or same bid
        if (newBidAmount <= carDetailsForValidation.highestBid) {
            return res.status(403).json({ error: 'Bid must be higher than current highest bid.' });
        }

        // Store bid in bids collection
        const bid = new BidModel({
            carId,
            userId,
            bidAmount: newBidAmount,
            time: new Date()
        });
        await bid.save();

        // Update highestBid and highestBidder in car document
        const carDetailsToUpdateCarDocument = await CarDetails.findByIdAndUpdate(
            carId,
            {
                highestBid: newBidAmount,
                highestBidder: userId
            },
            { new: true }
        );

        if (!carDetailsToUpdateCarDocument) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Emit bid update to clients all and car details room
        SocketService.broadcast(EVENTS.BID_UPDATED, { carId, highestBid: newBidAmount, userId });
        SocketService.emitToRoom(`car-${carId}`, EVENTS.BID_UPDATED, { carId, highestBid: newBidAmount, userId });


        return res.json({ success: true, highestBid: newBidAmount });
    } catch (error) {
        console.error('Error updating bid:', error);
        res.status(500).json({ error: 'Failed to update bid' });
    }
};

// Update auction time
exports.updateAuctionTime = async (req, res) => {
    try {
        const { carId, auctionStartTime, auctionDuration } = req.body;

        if (!carId) {
            return res.status(400).json({ error: 'carId is required' });
        }

        const updateData = {};
        let startTimeToUse = null;

        // Set auctionStartTime if provided
        if (auctionStartTime) {
            const parsedStart = new Date(auctionStartTime);
            updateData.auctionStartTime = parsedStart;
            startTimeToUse = parsedStart;
        }

        // Set auctionDuration if provided
        if (auctionDuration !== undefined) {
            updateData.auctionDuration = auctionDuration;
        }

        // If either startTime or duration is being updated, calculate auctionEndTime
        if ((auctionStartTime || auctionDuration !== undefined)) {
            // Get current car data to fill missing value if one is not provided
            const car = await CarDetails.findById(carId);
            if (!car) return res.status(404).json({ error: 'Car not found' });

            const finalStartTime = startTimeToUse || car.auctionStartTime;
            const finalDuration = auctionDuration !== undefined ? auctionDuration : car.auctionDuration;

            if (finalStartTime && finalDuration !== undefined) {
                const endTime = new Date(new Date(finalStartTime).getTime() + finalDuration * 3600000);
                updateData.auctionEndTime = endTime;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updatedCar = await CarDetails.findByIdAndUpdate(
            carId,
            updateData,
            { new: true }
        );

        if (!updatedCar) {
            return res.status(404).json({ error: 'Car not found' });
        }


        // ✅ Just one line to schedule
        const AgendaJobs = require('../Config/agenda_jobs');
        await AgendaJobs.scheduleAuctionEnd(updatedCar._id.toString(), updatedCar.auctionEndTime);


        res.json({ success: true, data: updatedCar });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update car fields' });
    }
};


// Check highest bidder
exports.checkHighestBidder = async (req, res) => {
    try {
        const { carId, userId } = req.body;

        // Validate input
        if (!carId || !userId) {
            return res.status(400).json({ error: 'carId and userId are required' });
        }

        // Get the highest bid for the car
        const highestBid = await BidModel.findOne({ carId })
            .sort({ bidAmount: -1, time: 1 }) // Highest first, then oldest if tie
            .limit(1);

        if (!highestBid) {
            return res.json({ isHighestBidder: false });
        }

        const isHighestBidder = highestBid.userId === userId;

        return res.json({ isHighestBidder });
    } catch (err) {
        console.error('Error in checkHighestBidder:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

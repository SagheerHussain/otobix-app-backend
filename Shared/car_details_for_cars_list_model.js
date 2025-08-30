// shared/car_details_for_cars_list_model.js
'use strict';

class CarDetailsForCarsListModel {
    static setCarDetails(src) {
        const car = src?.toObject ? src.toObject() : (src || {});
        const getFirstImage = (val) => {
            if (Array.isArray(val)) return val.length > 0 ? val[0] : null;
            if (typeof val === 'string') return val || null;
            return null;
        };
        const imageMapping = [ /* same as above */];
        const imageUrls = imageMapping
            .map(({ field, title }) => {
                const url = getFirstImage(car[field]);
                return url ? { title, url } : null;
            })
            .filter(Boolean);
        const imageUrl = getFirstImage(car.frontMain) || '';
        const isInspected = String(car.approvalStatus || '').toUpperCase() === 'APPROVED';
        const num = (v) => (v == null ? 0 : Number.isFinite(+v) ? +v : 0);
        const int = (v) => (v == null ? 0 : Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : 0);

        return {
            id: (car._id || car.id || '').toString(),
            imageUrl,
            make: car.make ?? '',
            model: car.model ?? '',
            variant: car.variant ?? '',
            priceDiscovery: num(car.priceDiscovery),
            yearMonthOfManufacture: car.yearMonthOfManufacture ?? null,
            odometerReadingInKms: int(car.odometerReadingInKms),
            ownerSerialNumber: int(car.ownerSerialNumber),
            fuelType: car.fuelType ?? '',
            commentsOnTransmission: car.commentsOnTransmission ?? '',
            taxValidTill: car.taxValidTill ?? null,
            registrationNumber: car.registrationNumber ?? '',
            registeredRto: car.registeredRto ?? '',
            inspectionLocation: car.city ?? car.inspectionLocation ?? '',
            isInspected,
            highestBid: num(car.highestBid),
            auctionStartTime: car.auctionStartTime ?? null,
            auctionEndTime: car.auctionEndTime ?? null,
            auctionDuration: int(car.auctionDuration),
            auctionStatus: car.auctionStatus ?? '',
            upcomingTime: car.upcomingTime ?? null,
            upcomingUntil: car.upcomingUntil ?? null,
            liveAt: car.liveAt ?? null,
            imageUrls,
        };
    }
}

module.exports = CarDetailsForCarsListModel;

import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../conf/dbConnection.js";
import { readCarOffer, readVin, type CarOffer } from "../validators/carOffer.js";
import { deletePhotos, readPhoto, savePhotos, type Photo } from "../utils/photo.util.js";


const ESTIMATE_LABEL = "Estimated – subject to inspection";

// Price rules (team decisions, change them here if the client asks for others)
const DEALER_MARGIN = 0.10;              // the dealership buys 10% under the base price of similar cars
const MILEAGE_STEP = 0.01;               // 1% of that price per 10,000 km above (or below) similar cars
const MIN_PRICE = 20000;                 // minimum price, in MXN
const MAX_ABOVE_ESTIMATE = 1.10;         // the customer can ask up to 10% above the estimate
const PRICE_COOLDOWN_HOURS = 24;         // the listing price can change once every 24 hours

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;

const NO_ESTIMATE = "we cannot estimate this car online, please schedule a sale evaluation";
const BELOW_MINIMUM = `the estimate is below the minimum price we buy online (${MIN_PRICE}), please schedule a sale evaluation`;


// Estimate = average base price of the dealership's cars of the same brand and model (year +-1),
// minus the margin, adjusted by mileage. Returns null when there are no similar cars to compare.
async function estimatePrice(offer: CarOffer): Promise<number | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        "select avg(base_price) as reference_price, avg(mileage) as reference_mileage from cars where brand = ? and model = ? and year between ? and ? and base_price is not null",
        [offer.brand, offer.model, offer.year - 1, offer.year + 1],
    );
    const reference = rows[0];
    if (!reference || reference["reference_price"] === null) return null;

    const referencePrice = Number(reference["reference_price"]);
    const extraKm = offer.mileage - Number(reference["reference_mileage"]);
    const estimate = referencePrice * (1 - DEALER_MARGIN) - (extraKm / 10000) * referencePrice * MILEAGE_STEP;

    // never more than the reference price; rounded to hundreds
    return Math.round(Math.min(estimate, referencePrice) / 100) * 100;
}


export class SaleOffersController {
    constructor() {}

    // POST /sale-offers/estimate
    // Body: { brand, model, year, version, mileage, fuelType, transmission, color }
    // Only shows the estimate, nothing is saved.
    public async estimateOffer(req: Request, res: Response) {
        const offer = readCarOffer(req.body);
        if (typeof offer === "string") {
            res.status(400).json({ message: offer });
            return;
        }

        try {
            const estimate = await estimatePrice(offer);
            if (estimate === null) {
                res.status(422).json({ message: NO_ESTIMATE });
                return;
            }
            if (estimate < MIN_PRICE) {
                res.status(422).json({ message: BELOW_MINIMUM });
                return;
            }
            res.status(200).json({ estimatedPrice: estimate, label: ESTIMATE_LABEL });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    }


    // POST /sale-offers
    // Body: the same car data + { appointmentId, token, vin, photos: ["data:image/jpeg;base64,..."], acceptEstimate: true }
    public async createOffer(req: Request, res: Response) {
        const offer = readCarOffer(req.body);
        if (typeof offer === "string") {
            res.status(400).json({ message: offer });
            return;
        }

        const { appointmentId, token, vin, photos, acceptEstimate } = req.body;

        // customers have no account: their "Sale evaluation" appointment and the token
        // in its email link prove who they are
        const id = Number(appointmentId);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ message: "appointmentId is not valid" });
            return;
        }
        if (typeof token !== "string" || !token.trim()) {
            res.status(400).json({ message: "token is required" });
            return;
        }

        const cleanVin = readVin(vin);
        if (!cleanVin) {
            res.status(400).json({ message: "vin must have 17 letters and numbers" });
            return;
        }

        if (!Array.isArray(photos) || photos.length < MIN_PHOTOS || photos.length > MAX_PHOTOS) {
            res.status(400).json({ message: `send between ${MIN_PHOTOS} and ${MAX_PHOTOS} photos` });
            return;
        }
        const checkedPhotos = photos.map(readPhoto);
        if (checkedPhotos.includes(null)) {
            res.status(400).json({ message: "every photo must be a JPG or PNG of up to 5 MB" });
            return;
        }

        // the request is only created if the customer accepts the estimate
        if (acceptEstimate !== true) {
            res.status(400).json({ message: "the estimate must be accepted to create the sale request" });
            return;
        }


        //the car, the trade, the notification and the log save together: all or nothing
        let savedPhotos: string[] = [];
        const connection = await pool.getConnection();
        try {
            //calculated again here: the price sent by the browser is never trusted
            const estimate = await estimatePrice(offer);
            if (estimate === null) {
                res.status(422).json({ message: NO_ESTIMATE });
                return;
            }
            if (estimate < MIN_PRICE) {
                res.status(422).json({ message: BELOW_MINIMUM });
                return;
            }

            await connection.beginTransaction();

            const [rows] = await connection.execute<RowDataPacket[]>(
                "select client_email, employee_id, appointment_type, status, car_id from appointments where appointment_id = ? and manage_token_hash = SHA2(?, 256) for update",
                [id, token.trim()],
            );
            const appointment = rows[0];

            if (!appointment) {
                await connection.rollback();
                res.status(404).json({ message: "appointment has not been found" });
                return;
            }
            if (appointment["appointment_type"] !== "Sale evaluation" || !["Pending", "Confirmed"].includes(appointment["status"])) {
                await connection.rollback();
                res.status(409).json({ message: "only a pending or confirmed sale evaluation appointment can receive a car offer" });
                return;
            }
            if (appointment["car_id"]) {
                await connection.rollback();
                res.status(409).json({ message: "this appointment already has a car offer" });
                return;
            }

            //the employee of the appointment; if there is none, the employee with the fewest active trades
            let employeeId = appointment["employee_id"];
            if (!employeeId) {
                const [staff] = await connection.execute<RowDataPacket[]>(
                    "select s.staff_id from staff s left join trades t on t.employee_id = s.staff_id and t.is_active = TRUE where s.role = 'Employee' group by s.staff_id order by count(t.trade_id), s.staff_id limit 1",
                );
                if (!staff[0]) {
                    await connection.rollback();
                    res.status(409).json({ message: "no employee can receive the request right now, please call the dealership" });
                    return;
                }
                employeeId = staff[0]["staff_id"];
            }

            savedPhotos = await savePhotos(checkedPhotos as Photo[], `${cleanVin}-${Date.now()}`);

            //the car enters as "Pending evaluation" and out of stock: it is still the customer's
            const [car] = await connection.execute<ResultSetHeader>(
                "insert into cars (vin, brand, model, year, version, mileage, fuel_type, transmission, color, status, test_drive_authorized, photos, inventory_status) values (?,?,?,?,?,?,?,?,?,'Pending evaluation', FALSE, ?, 'Out of stock')",
                [cleanVin, offer.brand, offer.model, offer.year, offer.version, offer.mileage, offer.fuelType, offer.transmission, offer.color, JSON.stringify(savedPhotos)],
            );

            await connection.execute(
                "update appointments set car_id = ? where appointment_id = ?",
                [car.insertId, id],
            );

            //Sale = the customer sells to the dealership
            const [trade] = await connection.execute<ResultSetHeader>(
                "insert into trades (appointment_id, employee_id, car_id, trade_type, status, estimated_price, listing_price) values (?,?,?,'Sale','In progress',?,?)",
                [id, employeeId, car.insertId, estimate, estimate],
            );

            await connection.execute(
                "insert into notifications (staff_id, message) values (?, ?)",
                [employeeId, `New sale offer ${trade.insertId}: ${offer.brand} ${offer.model} ${offer.year}, estimated ${estimate}`],
            );

            //log: log_date is filled by MySQL with the local date and time
            await connection.execute(
                "insert into trade_logs (client_email, trade_id, action, estimated_price) values (?,?,?,?)",
                [appointment["client_email"], trade.insertId, "Sale offer created", estimate],
            );

            await connection.commit();
            res.status(201).json({
                message: "sale request has been created",
                tradeId: trade.insertId,
                carId: car.insertId,
                status: "In progress",
                estimatedPrice: estimate,
                label: ESTIMATE_LABEL,
            });
        } catch (error) {
            //any error: nothing is saved and the photos are deleted
            await connection.rollback();
            await deletePhotos(savedPhotos);
            if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
                res.status(409).json({ message: "a car with this VIN is already registered" });
                return;
            }
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        } finally {
            connection.release();
        }
    }


    // PATCH /sale-offers/:id/listing-price
    // Body: { "token": "token from the email link", "listingPrice": 230000 }
    public async updateListingPrice(req: Request, res: Response) {
        const id = Number(req.params["id"]);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ message: "this id is not valid" });
            return;
        }

        const { token, listingPrice } = req.body ?? {};

        if (typeof token !== "string" || !token.trim()) {
            res.status(400).json({ message: "token is required" });
            return;
        }

        // a real number, at least the minimum, with up to 2 decimals
        if (typeof listingPrice !== "number" || !Number.isFinite(listingPrice) || listingPrice < MIN_PRICE ||
            Math.round(listingPrice * 100) / 100 !== listingPrice) {
            res.status(400).json({ message: `listingPrice must be a number of at least ${MIN_PRICE} with up to 2 decimals` });
            return;
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            //in_cooldown uses the database clock, the same one that saved last_price_edit
            const [rows] = await connection.execute<RowDataPacket[]>(
                "select t.trade_type, t.status, t.is_active, t.estimated_price, t.listing_price, t.employee_id, a.client_email, t.last_price_edit > NOW() - INTERVAL ? HOUR as in_cooldown from trades t join appointments a on a.appointment_id = t.appointment_id where t.trade_id = ? and a.manage_token_hash = SHA2(?, 256) for update",
                [PRICE_COOLDOWN_HOURS, id, token.trim()],
            );
            const trade = rows[0];

            if (!trade) {
                await connection.rollback();
                res.status(404).json({ message: "sale request has not been found" });
                return;
            }
            if (trade["trade_type"] !== "Sale" || trade["status"] !== "In progress" || !trade["is_active"]) {
                await connection.rollback();
                res.status(409).json({ message: "the listing price can only be changed while the sale request is in progress" });
                return;
            }
            if (trade["in_cooldown"]) {
                await connection.rollback();
                res.status(409).json({ message: `the listing price can only be changed once every ${PRICE_COOLDOWN_HOURS} hours` });
                return;
            }

            const estimate = Number(trade["estimated_price"]);
            const maxPrice = Math.round(estimate * MAX_ABOVE_ESTIMATE * 100) / 100;
            if (listingPrice > maxPrice) {
                await connection.rollback();
                res.status(400).json({ message: `listingPrice can be at most 10% above the estimate (${maxPrice})` });
                return;
            }

            const previousPrice = trade["listing_price"] === null ? null : Number(trade["listing_price"]);

            await connection.execute(
                "update trades set listing_price = ?, last_price_edit = NOW() where trade_id = ?",
                [listingPrice, id],
            );

            await connection.execute(
                "insert into notifications (staff_id, message) values (?, ?)",
                [trade["employee_id"], `Sale offer ${id}: listing price changed from ${previousPrice} to ${listingPrice}`],
            );

            await connection.execute(
                "insert into trade_logs (client_email, trade_id, action, estimated_price, previous_price, new_price) values (?,?,?,?,?,?)",
                [trade["client_email"], id, "Listing price changed", estimate, previousPrice, listingPrice],
            );

            await connection.commit();
            res.status(200).json({
                message: "listing price has been updated",
                tradeId: id,
                previousPrice,
                listingPrice,
            });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        } finally {
            connection.release();
        }
    }
}
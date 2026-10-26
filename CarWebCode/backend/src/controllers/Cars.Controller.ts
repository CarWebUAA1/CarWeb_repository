import type { Request, Response } from "express";
import { pool } from "../conf/dbConnection.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";



export class CarsController {
constructor() {}

public async getAllCars(_req: Request, res: Response) {
    try {
    const [cars] = await pool.execute(
         "select * from Cars where InventoryStatus = 1",
    );
    res.json(cars);
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "internal server error" });
    }
}



public async getCarsById(req: Request, res: Response) {
    try {
        const id = Number(req.params["id"]);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: "this id is not valid" });
        return;
    }

    const [cars] = await pool.execute<RowDataPacket[]>(
        "select * from Cars where CarId = ? and InventoryStatus = 1",
        [id],
    );

        if (!cars[0]) {
        res.status(404).json({ message: "the car could not be found" });
        return;
    }
    res.json(cars[0]);
    } catch (error){
        console.error(error);
    res.status(500).json({ message: "internal server error" });
    }
}



public async createCar(req: Request, res: Response) {
    try {
    const {VIN, Brand, Model, YearOfCar, Mileage, Color, StatusOfCar, PurchasePrice, SalePrice} = req.body;
    
    const priceNumber = Number(PurchasePrice);
    if( priceNumber <= 0 || typeof PurchasePrice !== 'number' ){
        res.status(400).json({message: "this ammount is not valid"});
        return;
    }

    if (!Number.isFinite(PurchasePrice) || PurchasePrice <= 0 ||
        !Number.isFinite(SalePrice) || SalePrice <= 0) {
            res.status(400).json({ message: "purchase price and sale price must be positive numbers" });
            return;
    }

    await pool.execute(
        "insert into Cars (VIN, Brand, Model, YearOfCar, Mileage, Color, StatusOfCar, PurchasePrice, SalePrice) values (?,?,?,?,?,?,?,?,?)",
        [VIN, Brand, Model, YearOfCar, Mileage, Color, StatusOfCar, priceNumber, SalePrice],
    );
    res.status(201).json({ message:"car has been created"});
    } catch(error){
        console.error(error);
    res.status(500).json({ message: "internal server error" });
    }
}


public async updateCar(req: Request, res: Response) {
    try {
    const id = Number(req.params["id"]);

    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({message: "this id is not valid"});
        return;
}

    const {VIN, Brand, Model, YearOfCar, Mileage, Color, StatusOfCar, PurchasePrice, SalePrice} = req.body;

    const priceNumber = Number(PurchasePrice);
    if( priceNumber <= 0 || typeof PurchasePrice !== 'number' ){
        res.status(400).json({message: "this ammount is not valid"});
        return;
}

    const [result] = await pool.execute<ResultSetHeader>(
        "update Cars set VIN = ?, Brand = ?, Model = ?, YearOfCar = ?, Mileage = ?, Color = ?, StatusOfCar = ?, PurchasePrice = ?, SalePrice = ? where CarId = ? and InventoryStatus = 1",
        [VIN, Brand, Model, YearOfCar, Mileage, Color, StatusOfCar, priceNumber, SalePrice, id],

        
    );
    if (result.affectedRows === 0) {
        res.status(404).json({ message: "car has not found" });
        return;
    }
    res.status(200).json({ message: "car updated" });
    } catch(error){
        console.error(error);
    res.status(500).json({ message: "internal server error" });
    }
}




    public async updatePrice(req: Request, res: Response) {
    try {
    const id = Number(req.params["id"]);

    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({message: "this id is not valid"});
        return;
    }

    const { price } = req.body;

    const priceNumber = Number(price);
        if( priceNumber <= 0 || typeof price !== 'number'){
        res.status(400).json({message: "this ammount is not valid"});
        return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
        "update Cars set SalePrice = ? where CarId = ? and InventoryStatus = 1",
        [price, id],
    );
    if (result.affectedRows === 0) {
        res.status(404).json({ message: "car has not been found" });
        return;
    }
    res.status(200).json({ message: "car has been updated" });
    } catch(error){
        console.error(error);
    res.status(500).json({ message: "internal server error" });
    }
}



public async deleteCar(req: Request, res: Response){
    try{
    const id = Number(req.params["id"]);

    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({message: "this id is not valid"});
        return;
    }
    const [result] = await pool.execute<ResultSetHeader>(
        "update Cars set InventoryStatus = 0 where CarId = ? and InventoryStatus = 1",
        [id],
    );
    if (result.affectedRows === 0) {
        res.status(404).json({ message: "car has not found" });
        return;
    }
        res.status(200).json({ message: "car has been deleted" });
    } catch(error){
        console.error(error);
        res.status(500).json({ message: "internal server error"});
    }
  }
}
import {body, param } from "express-validator";

export const idParam = [
    param("id").isInt({ gt: 0}).withMessage("this id is not valid"),
];

const carFields = [ 
    body("VIN").notEmpty().withMessage("vin is required"),
    body("Brand").notEmpty().withMessage("brand is required"),
    body("Model").notEmpty().withMessage("model is required"),
    body("Mileage").isInt({min: 0}).withMessage("Mileage must be 0 or more"),
    body("Color").notEmpty().withMessage("color is required"),
    body("PurchasePrice").isFloat({gt: 0}).withMessage("Price must be greater than 0"),
    body("SalePrice").isFloat({gt: 0}).withMessage("SalePrice must be greater than 0"),  
];

export const createCarRules = carFields;
export const updateCarRules = [...idParam, ...carFields];
export const updatePriceRules = [...idParam, body("price").isFloat({ gt: 0 }).withMessage("price must be greater than 0")];
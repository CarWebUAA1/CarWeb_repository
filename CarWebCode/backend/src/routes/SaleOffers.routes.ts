import { SaleOffersController } from "../controllers/SaleOffers.controller.js";
import { Router } from "express";

const router = Router();
const saleOffersController = new SaleOffersController();


router.post('/estimate', saleOffersController.estimateOffer);
router.post('/', saleOffersController.createOffer);
router.patch('/:id/listing-price', saleOffersController.updateListingPrice);

export default router;
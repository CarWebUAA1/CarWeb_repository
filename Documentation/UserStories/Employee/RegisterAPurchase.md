# Register A Purchase

As an employee, I want to record the purchase transactions so that the system maintains a reliable transaction history and updates the inventory.

This enables traceability and financial control of the business.This is where an online request becomes a real transaction. Registering it with its payment and contract gives the Manager everything needed to approve it.
## Acceptance criteria

* The system must allow the recording of vehicle purchase transactions.
* Each transaction must include a unique identifier, transaction type, vehicle, customer or supplier, price, date, and the responsible employee.
* The system must validate that all mandatory fields are filled in and that the price is valid.
* The system must verify that the necessary documentation has been validated before completing the transaction.
* The system must automatically update the inventory after confirming the transaction.
* The system must prevent the same transaction from being recorded twice by mistake.
* The system must maintain a searchable history of completed transactions.
* The system must allow transactions to be queried by date range, transaction type, and vehicle.
* The system must validate that the filter's start date is not later than the end date.
* The system must not display logically deleted or inactive transaction records in standard queries.

## Definition of done

* [ ] Purchase and sales logging has been implemented.
* [ ] Automatic inventory updating has been implemented.
* [ ] Prevention of sales of unavailable vehicles has been verified.
* [ ] Prevention of duplicate transactions has been tested.
* [ ] Transaction history has been implemented and tested.
* [ ] Date filters and range validation have been tested.
* [ ] It has been verified that inactive transactions do not appear in standard queries.
* [ ] Transaction logging and traceability have been tested.
* [ ] Data integrity in the event of transaction errors has been verified.

## Dificulty of implementacion 4/5